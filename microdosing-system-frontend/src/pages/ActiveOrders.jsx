import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Orders from './Orders';
import { useDosing } from './DosingContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ActiveOrders = () => {
  const [order, setOrder] = useState({
    order_id: 101,
    recipe_name: 'Formula A',
    materials: [],
  });

  // initialize once in App.js
  toast.configure();


  const { addDosingRecord } = useDosing();
  const barcodeRefs = useRef({});
  const overlayBarcodeRef = useRef(null);
  const [scannedCode, setScannedCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannedCodeRef = useRef('');
  const [scannedDisplay, setScannedDisplay] = useState('');
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [actualValue, setActualValue] = useState(null);
  const [barcodeMatched, setBarcodeMatched] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchActiveMaterial = async () => {
      try {
        // First try to fetch active material from the new endpoint
        const activeResponse = await axios.get('http://127.0.0.1:5000/api/active-material');
        if (activeResponse.data) {
          const rawMaterial = activeResponse.data;
          const transformedMaterial = {
            id: rawMaterial.material_id,
            title: rawMaterial.title,
            barcode: rawMaterial.barcode_id,
            setPoint: rawMaterial.maximum_quantity,
            actual: rawMaterial.current_quantity,
            unit: rawMaterial.unit_of_measure,
            recipe: 'Formula A',
            dosed: false,
            margin: rawMaterial.margin,
            status: rawMaterial.status,
          };
          setOrder(prev => ({
            ...prev,
            materials: [transformedMaterial],
          }));
          return;
        }
        
        // Fallback to recipe materials if no active material
        const recipeResponse = await axios.get('http://127.0.0.1:5000/api/recipe_materials');
        const recipeMaterials = recipeResponse.data || [];

        const enrichedMaterials = await Promise.all(
          recipeMaterials.map(async (mat, idx) => {
            try {
              const [recipeRes, materialRes] = await Promise.all([
                axios.get(`http://127.0.0.1:5000/api/recipes/${mat.recipe_id}`),
                axios.get(`http://127.0.0.1:5000/api/materials/${mat.material_id}`),
              ]);

              return {
                id: mat.recipe_material_id || idx + 1,
                title: materialRes.data?.title || `Material #${mat.material_id}`,
                recipeName: recipeRes.data?.name || `Recipe #${mat.recipe_id}`,
                barcode: materialRes.data?.barcode_id,
                setPoint: mat.set_point,
                actual: mat.actual,
                unit: materialRes.data?.unit_of_measure || '',
                status: mat.status,
                dosed: false,
                margin: materialRes.data?.margin,
              };
            } catch (innerErr) {
             
              alert(`Error fetching names for recipe_id ${mat.recipe_id} or material_id ${mat.material_id} : ${innerErr}`);
              return null;
            }
          })
        );

        const validMaterials = enrichedMaterials.filter(Boolean);
        setOrder(prev => ({
          ...prev,
          materials: validMaterials,
          recipe_name: validMaterials[0]?.recipeName || 'Formula A',
        }));

      } catch (error) {
        alert(`Error fetching materials: ${error}`);
      }
    };

    fetchActiveMaterial();
  }, []);

  useEffect(() => {
    if (order.materials.length > 0 && currentIndex < order.materials.length) {
      setCurrentMaterial(order.materials[currentIndex]);
    } else {
      setCurrentMaterial(null);
    }
  }, [order.materials, currentIndex]);

  useEffect(() => {
    Object.entries(barcodeRefs.current).forEach(([barcode, el]) => {
      if (el && window.JsBarcode) {
        window.JsBarcode(el, barcode, {
          format: "CODE128",
          displayValue: false,
          height: 30,
        });
      }
    });
  }, [order.materials]);

  useEffect(() => {
    if (scannedDisplay && overlayBarcodeRef.current && window.JsBarcode) {
      window.JsBarcode(overlayBarcodeRef.current, scannedDisplay, {
        format: "CODE128",
        displayValue: true,
        height: 60,
        fontSize: 16,
      });
    }
  }, [scannedDisplay]);

  useEffect(() => {
    if (!scanning || !currentMaterial) return;
  
    const expected = currentMaterial?.barcode?.trim();
    setScannedDisplay(expected);
  
    const timeoutId = setTimeout(() => {
      if (!expected) {
        alert(`⚠️ No barcode present for ${currentMaterial.title || currentMaterial.materialName}`);
        setBarcodeMatched(false);
        setScannedDisplay('');
        setScanning(false);
        return;
      }
  
      const isValidFormat = /^[A-Za-z0-9\-_.]{5,30}$/.test(expected);
  
      if (isValidFormat) {
        alert(`✅ Barcode is valid for ${currentMaterial.title || currentMaterial.materialName}`);
        setBarcodeMatched(true);
      } else {
        alert(`❌ Barcode format is invalid for ${currentMaterial.title || currentMaterial.materialName}`);
        setBarcodeMatched(false);
      }
  
      setScannedDisplay('');
      setScanning(false);
    }, 5000);
  
    return () => clearTimeout(timeoutId);
  }, [scanning, currentMaterial]);

  const handleScan = () => {
    if (!currentMaterial) {
      alert('No material selected for scanning.');
      return;
    }
    scannedCodeRef.current = '';
    setScanning(true);
    setScannedCode("");
    alert(`Scan the barcode for ${currentMaterial.title || currentMaterial.materialName}`);
  };

  const confirmDosing = async () => {
    if (!currentMaterial || currentMaterial.setPoint === undefined) {
      alert("Material or set point is missing.");
      return;
    }

    const tolerance = 0.5;
    const actualWeight = currentMaterial.actual;
    const minAcceptable = currentMaterial.setPoint * (1 - tolerance);
    const maxAcceptable = currentMaterial.setPoint * (1 + tolerance);

    if (actualWeight < minAcceptable || actualWeight > maxAcceptable) {
      alert(`❌ Dosing out of tolerance!\nEntered: ${actualWeight} ${currentMaterial.unit}\nAcceptable Range: ${minAcceptable} - ${maxAcceptable} ${currentMaterial.unit}`);
      return;
    }

    try {
      // Create dosing record
      const dosingRecord = {
        orderId: order.order_id,
        recipeName: order.recipe_name,
        materialId: currentMaterial.id,
        materialName: currentMaterial.title,
        setPoint: currentMaterial.setPoint,
        actual: actualWeight,
        unit: currentMaterial.unit,
        timestamp: new Date().toISOString(),
        status: 'completed',
        margin: currentMaterial.margin
      };

      // Save to context
      addDosingRecord(dosingRecord);

      // Update local state
      setOrder(prev => {
        const updatedMaterials = [...prev.materials];
        updatedMaterials[currentIndex] = {
          ...updatedMaterials[currentIndex],
          actual: actualWeight,
          dosed: true,
        };
        return { ...prev, materials: updatedMaterials };
      });

      alert("✅ Dosing completed successfully!");
      advanceToNext();
    } catch (error) {
      alert(`Error saving dosing record: ${error}`);
      alert('Failed to save dosing record. Please try again.');
    }
  };

  const bypassMaterial = () => {
    // Create bypass record
    const bypassRecord = {
      orderId: order.order_id,
      recipeName: order.recipe_name,
      materialId: currentMaterial.id,
      materialName: currentMaterial.title,
      setPoint: currentMaterial.setPoint,
      actual: 0,
      unit: currentMaterial.unit,
      timestamp: new Date().toISOString(),
      status: 'bypassed',
      margin: currentMaterial.margin
    };

    // Save to context
    addDosingRecord(bypassRecord);

    // Update local state
    setOrder(prev => {
      const updatedMaterials = [...prev.materials];
      updatedMaterials[currentIndex] = {
        ...updatedMaterials[currentIndex],
        dosed: true,
        bypassed: true,
      };
      return { ...prev, materials: updatedMaterials };
    });

    advanceToNext();
  };

  const advanceToNext = () => {
    setActualValue('');
    setBarcodeMatched(false);

    if (currentIndex + 1 < order.materials.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      alert('✅ All materials completed (dosed or bypassed). Order Complete.');
    }
  };

  return (
    <div className="p-6 text-black bg-white min-h-screen">
      <Orders />
      <h2 className="text-3xl font-bold mb-6">Active Order: {order.recipe_name}</h2>

      {/* Scan Button */}
      <div className="mb-4 flex gap-4 items-center">
        <button
          onClick={handleScan}
          className="bg-indigo-600 text-white px-6 py-2 rounded shadow-md hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <i className="fa-solid fa-qrcode"></i> Start Barcode Scan
        </button>

        <span className="text-lg font-medium">
          {barcodeMatched ? '✅ Scanned Successfully' : 'Waiting for scan...'}
        </span>
      </div>
 

      {/* Materials Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left border bg-gray-200">
          <thead className="bg-gray-300 text-sm">
            <tr>
              <th className="p-3 border">Formula</th>
              <th className="p-3 border">Material</th>
              <th className="p-3 border">Barcode</th>
              <th className="p-3 border">Set Point</th>
              <th className="p-3 border">Actual</th>
              <th className="p-3 border">Err%</th> {/* 👈 Added Header */}
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {order.materials.map((mat, idx) => (
              <tr
                key={mat.id}
                className={
                  idx === currentIndex
                    ? 'bg-blue-50'
                    : mat.dosed
                      ? 'bg-green-100'
                      : 'bg-white'
                }
              >
                <td className="p-3 border">{mat.recipe || mat.recipeName}</td>
                <td className="p-3 border font-semibold">{mat.title}</td>
                <td className="p-3 border text-sm">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-xs text-gray-400">{mat.barcode}</span>
                    {mat.barcode ? (
                      <svg
                        ref={(el) => (barcodeRefs.current[mat.barcode] = el)}
                        style={{ width: '100%', maxWidth: '150px', height: '40px', objectFit: 'contain' }}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No Barcode</span>
                    )}
                  </div>
                </td>
                <td className="p-3 border">{mat.setPoint}</td>
                <td className="p-3 border">
                  {idx === currentIndex && mat.dosed
                    ? actualValue
                      ? mat.actual
                      : '—'
                    : mat.actual
                      ? mat.actual
                      : '—'}
                </td>
                <td className="p-3 border">
                  {mat.setPoint && mat.actual
                    ? `${Math.abs(((mat.actual - mat.setPoint) / mat.setPoint) * 100).toFixed(2)}%`
                    : '—'}
                </td>
                <td className="p-3 border">
                  {mat.dosed
                    ? mat.bypassed
                      ? 'Bypassed'
                      : 'Dosed ✅'
                    : idx === currentIndex
                      ? 'In Progress'
                      : 'Pending'}
                </td>
                <td className="p-3 border">
                  {idx === currentIndex && !mat.dosed && (
                    <div className="flex gap-2">
                      <button
                        onClick={confirmDosing}
                        className="bg-green-600 text-white px-4 py-2 rounded shadow-md hover:bg-green-700 transition"
                      >
                        ✅ Confirm
                      </button>
                      <button
                        onClick={bypassMaterial}
                        className="bg-red-600 text-white px-4 py-2 rounded shadow-md hover:bg-red-700 transition"
                      >
                        🚫 Bypass
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scannedDisplay && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#222',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          fontSize: '18px',
          zIndex: 1000,
          fontWeight: 'bold',
        }}>
          <p style={{ fontSize: '20px', marginBottom: '10px' }}>Verifying Barcode: {scannedDisplay}</p>
          <svg ref={overlayBarcodeRef}></svg>
        </div>
      )}
    </div>
  );
};

export default ActiveOrders;