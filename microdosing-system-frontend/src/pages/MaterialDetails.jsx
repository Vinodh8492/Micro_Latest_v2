import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import JsBarcode from "jsbarcode";
import Swal from "sweetalert2";
import { TablePagination } from "@mui/material";
import {
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const MaterialDetails = () => {
  const barcodeRefs = useRef({});
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [selectedBarcodeId, setSelectedBarcodeId] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `http://127.0.0.1:5000/api/materials?page=${page}&limit=${limit}`
        );
        const { materials: fetchedMaterials, total: totalCount } = response.data;

        const savedOrder = JSON.parse(localStorage.getItem("materialOrder"));
        if (savedOrder) {
          fetchedMaterials.sort(
            (a, b) => savedOrder.indexOf(a.material_id) - savedOrder.indexOf(b.material_id)
          );
        }

        setMaterials(fetchedMaterials);
        setTotal(totalCount);
      } catch (error) {
        alert(`error fecthing materials : ${error}`)
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [page, limit]);

  const saveOrderToLocalStorage = (materialsList) => {
    const materialIds = materialsList.map((mat) => mat.material_id);
    localStorage.setItem("materialOrder", JSON.stringify(materialIds));
  };

  useEffect(() => {
    if (materials.length > 0) {
      materials.forEach((material) => {
        const barcodeElement = barcodeRefs.current[material.barcode_id];
        if (material?.barcode_id && barcodeElement) {
          JsBarcode(barcodeElement, material.barcode_id, {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: true,
            lineColor: "black",
            background: "transparent",
          });
        }
      });
    }
  }, [materials]);

  const handleEdit = (material_id) => {
    navigate(`/material/${material_id}`);
  };

  const handleDelete = async (material_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      customClass: {
        popup: "relative",
      },
      didOpen: () => {
        const swal = Swal.getPopup();

        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "&times;";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "10px";
        closeBtn.style.right = "10px";
        closeBtn.style.background = "#fff";
        closeBtn.style.color = "#f44336";
        closeBtn.style.border = "2px solid #f44336";
        closeBtn.style.borderRadius = "50%";
        closeBtn.style.width = "30px";
        closeBtn.style.height = "30px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontSize = "18px";
        closeBtn.style.lineHeight = "0";
        closeBtn.style.display = "flex";
        closeBtn.style.justifyContent = "center";
        closeBtn.style.alignItems = "center";

        closeBtn.onclick = () => {
          Swal.close();
        };
        swal.appendChild(closeBtn);
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `http://127.0.0.1:5000/api/materials/${material_id}`
          );
          setMaterials(materials.filter((m) => m.material_id !== material_id));
          Swal.fire("Deleted!", "The material has been deleted.", "success");
        } catch (error) {
          Swal.fire("Error!", "Failed to delete the material.", "error");
        }
      }
    });
  };

  const handleBarcodeClick = (barcodeId) => {
    setSelectedBarcodeId(barcodeId);
    setBarcodeDialogOpen(true);
  };

  const handlePrint = (material_id) => {
    const barcodeData = materials.find(
      (m) => m.material_id === material_id
    )?.barcode_id;
    if (!barcodeData) return;

    const canvas = document.createElement("canvas");

    JsBarcode(canvas, barcodeData, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: true,
      lineColor: "black",
    });

    const barcodeImageUrl = canvas.toDataURL("image/png");
    const win = window.open("", "PrintWindow", "width=600,height=400");

    if (!win) {
      alert("Popup blocked. Please allow popups for this site.");
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin-top: 50px;
            }
            img {
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h3>Material Barcode</h3>
          <img src="${barcodeImageUrl}" alt="Barcode" />
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);

    win.document.close();
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...materials];
    [newOrder[index - 1], newOrder[index]] = [
      newOrder[index],
      newOrder[index - 1],
    ];
    setMaterials(newOrder);
    saveOrderToLocalStorage(newOrder);
  };

  const handleMoveDown = (index) => {
    if (index === materials.length - 1) return;
    const newOrder = [...materials];
    [newOrder[index + 1], newOrder[index]] = [
      newOrder[index],
      newOrder[index + 1],
    ];
    setMaterials(newOrder);
    saveOrderToLocalStorage(newOrder);
  };

  const handleNavigateToCreateForm = () => {
    navigate("/material/create");
  };

  if (loading)
    return <CircularProgress sx={{ margin: "2rem auto", display: "block" }} />;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Material Details
      </Typography>

      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNavigateToCreateForm}
        >
          <AddCircleOutlineIcon sx={{ mr: 1 }} />
          Add Material
        </Button>
        <Button variant="contained" style={{ backgroundColor: '#16a34a' }} onClick={() => navigate("/material-transactions")}>
          ➕ Add Material Transaction
        </Button>
        <Button variant="contained" color="warning">
          Export CSV
        </Button>
      </Box>

      <Dialog
        open={barcodeDialogOpen}
        onClose={() => setBarcodeDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Barcode Preview
          <IconButton
            onClick={() => setBarcodeDialogOpen(false)}
            sx={{ color: "#000" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {selectedBarcodeId && (
            <svg
              ref={(el) => {
                if (el) {
                  JsBarcode(el, selectedBarcodeId, {
                    format: "CODE128",
                    width: 2,
                    height: 60,
                    displayValue: true,
                    lineColor: "#000",
                    background: "transparent",
                  });
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <TableContainer component={Paper}>
        <Table sx={{ border: "1px solid #ccc" }}>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow sx={{ "& > th": { border: "1px solid #ccc" } }}>
              <TableCell>Reorder</TableCell>
              <TableCell>Material</TableCell>
              <TableCell>UOM</TableCell>
              <TableCell>Storage</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody sx={{ "& > tr": { border: "1px solid #ccc" } }}>
            {materials.map((material, index) => (
              <TableRow
                key={material.material_id}
                sx={{ "& > td": { border: "1px solid #ccc" } }}
              >
                <TableCell>
                  <IconButton
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUpwardIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleMoveDown(index)}
                    disabled={index === materials.length - 1}
                  >
                    <ArrowDownwardIcon />
                  </IconButton>
                </TableCell>
                <TableCell>{material.title}</TableCell>
                <TableCell>{material.unit_of_measure}</TableCell>
                <TableCell>{material.plant_area_location}</TableCell>
                <TableCell>
                  {material.barcode_id ? (
                    <svg
                      onClick={() => handleBarcodeClick(material.barcode_id)}
                      style={{ cursor: "pointer" }}
                      ref={(el) =>
                        (barcodeRefs.current[material.barcode_id] = el)
                      }
                    />
                  ) : (
                    "No Barcode"
                  )}
                </TableCell>

                <TableCell>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => handleEdit(material.material_id)}
                        sx={{
                          backgroundColor: "#1976d2",
                          color: "#fff",
                          "&:hover": { backgroundColor: "#1565c0" },
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDelete(material.material_id)}
                        sx={{
                          backgroundColor: "#d32f2f",
                          color: "#fff",
                          "&:hover": { backgroundColor: "#b71c1c" },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Print">
                      <IconButton
                        onClick={() => handlePrint(material.material_id)}
                        sx={{
                          backgroundColor: "#6a1b9a",
                          color: "#fff",
                          "&:hover": { backgroundColor: "#4a148c" },
                        }}
                      >
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(event, newPage) => setPage(newPage + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(event) => {
            setPage(1);
            setLimit(parseInt(event.target.value, 10));
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </TableContainer>

    </Box>
  );
};

export default MaterialDetails;