import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Barcode from 'react-barcode';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const CreateStorageBucketForm = () => {
  const [materialId, setMaterialId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [locations, setLocations] = useState([]);
  const [materialName, setMaterialName] = useState('');
  const [selectedLocations, setSelectedLocations] = useState(['']);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data } = await axios.get('http://127.0.0.1:5000/api/materials/all');
        setMaterials(data);

        const uniqueLocations = [...new Set(data.map(item => item.plant_area_location))];
        setLocations(uniqueLocations);
      } catch (error) {
        console.error('Error fetching materials:', error);
        alert('Failed to load materials. Please try again.');
      }
    };

    fetchMaterials();
  }, []);

  useEffect(() => {
    if (!materialId) {
      setMaterialName('');
      return;
    }

    const fetchMaterialName = async () => {
      try {
        const { data } = await axios.get(`http://127.0.0.1:5000/api/materials/${materialId}`);
        setMaterialName(data.title);
      } catch (error) {
        console.error('Error fetching material name:', error);
        setMaterialName('');
      }
    };

    fetchMaterialName();
  }, [materialId]);

  const handleMaterialChange = (e) => {
    setMaterialId(e.target.value);
  };

  const addLocation = () => {
    setSelectedLocations(prev => [...prev, '']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validLocations = selectedLocations.filter(loc => loc.trim() !== '');

    if (!materialId || validLocations.length === 0) {
      alert('Please select a valid material and at least one valid location.');
      return;
    }

    try {
      const payload = {
        material_id: materialId,
        locations: validLocations
      };

      const { data } = await axios.post('http://127.0.0.1:5000/api/storage', payload);

      setMessage('Storage bucket created successfully!');
      alert('Storage Bucket Created Successfully!');
      console.log(data);
      navigate(-1);
    } catch (error) {
      console.error('Error creating storage bucket:', error.response?.data || error.message);
      setMessage('Error creating storage bucket.');
      alert(error.response?.data?.error || 'Failed to create storage bucket.');
      navigate('/storage');
    }
  };

  const handleLocationChange = (index, newValue) => {
    const updatedLocations = [...selectedLocations];
    updatedLocations[index] = newValue;
    setSelectedLocations(updatedLocations);
  };

  const removeLocation = (index) => {
    const updatedLocations = [...selectedLocations];
    updatedLocations.splice(index, 1);
    setSelectedLocations(updatedLocations);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Create Storage Buckets</h1>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            border: '1px solid red',
            borderRadius: '50%',
            padding: '6px',
            height: '40px',
            width: '40px',
          }}
        >
          <CloseIcon sx={{ color: 'red' }} />
        </IconButton>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label htmlFor="materialId" className="font-bold">Select Material</label>
          <select
            id="materialId"
            value={materialId}
            onChange={handleMaterialChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">-- Choose Material --</option>
            {materials.map((material) => (
              <option key={material.material_id} value={material.material_id}>
                {material.title}
              </option>
            ))}
          </select>
        </div>

        {materialName && (
          <div>
            <label className="font-bold">Material Name</label>
            <p>{materialName}</p>
          </div>
        )}

        <div>
          <label className="font-bold">Locations</label>
          {selectedLocations.map((loc, index) => (
            <div key={index} className="flex items-center mb-2">
              <select
                value={loc}
                onChange={(e) => handleLocationChange(index, e.target.value)}
                className="w-full p-2 border rounded mr-2"
                required
              >
                <option value="">-- Choose Location --</option>
                {locations.map((location, idx) => (
                  <option key={idx} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeLocation(index)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLocation}
            className="bg-blue-500 text-white px-2 py-1 rounded mt-2"
          >
            Add Location
          </button>
        </div>

        {materialId && (
          <div>
            <label className="font-bold">Sample Barcode</label>
            <Barcode value={`STR${materialId}`} className="my-4" />
          </div>
        )}

        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create Storage Buckets
        </button>

        <br />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => navigate(-1)}
        >
          Back
        </button>
      </form>

      {message && <p className="mt-4 text-blue-700 font-semibold">{message}</p>}
    </div>
  );
};

export default CreateStorageBucketForm;
