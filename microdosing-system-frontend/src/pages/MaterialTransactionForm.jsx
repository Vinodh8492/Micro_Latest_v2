import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';

import CloseIcon from '@mui/icons-material/Close';

const MaterialTransactionForm = () => {
  const [materials, setMaterials] = useState([]);
  const [transaction, setTransaction] = useState({
    material_id: "",
    transaction_type: "addition",
    quantity: "",
    description: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/api/materials/all")
      .then((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          setMaterials(data);
        } else {
          alert(`Fetched materials are not an array: ${data}`);
          setMaterials([]);
        }
      })
      .catch((error) => {
        alert(`Error fetching materials: ${error}`);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransaction((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddQuantity = async (material_id) => {
    try {
      const addAmount = parseFloat(transaction.quantity);
      const updatedMaterials = materials.map((material) => {
        if (material.material_id === material_id) {
          const currentQty = parseFloat(material.current_quantity);
          const maxQty = parseFloat(material.maximum_quantity);
          if (currentQty + addAmount > maxQty) {
            alert("Cannot exceed maximum quantity.");
            return material;
          }
          return {
            ...material,
            current_quantity: (currentQty + addAmount).toFixed(2),
          };
        }
        return material;
      });

      const changed = updatedMaterials.find((mat) => mat.material_id === material_id);
      const original = materials.find((mat) => mat.material_id === material_id);

      if (!changed || changed.current_quantity === original?.current_quantity) return;

      setMaterials(updatedMaterials);

      await axios.put(`http://127.0.0.1:5000/api/materials/${material_id}`, {
        current_quantity: changed.current_quantity,
      });

      alert("Quantity added successfully!");
    } catch (error) {
      alert(`Error adding quantity: ${error}`);
    }
  };

  const handleSubtractQuantity = async (material_id) => {
    try {
      const subtractAmount = parseFloat(transaction.quantity);
      const updatedMaterials = materials.map((material) => {
        if (material.material_id === material_id) {
          const currentQty = parseFloat(material.current_quantity);
          const minQty = parseFloat(material.minimum_quantity);
          if (currentQty - subtractAmount < minQty) {
            alert("Cannot go below minimum quantity.");
            return material;
          }
          return {
            ...material,
            current_quantity: (currentQty - subtractAmount).toFixed(2),
          };
        }
        return material;
      });

      const changed = updatedMaterials.find((mat) => mat.material_id === material_id);
      const original = materials.find((mat) => mat.material_id === material_id);

      if (!changed || changed.current_quantity === original?.current_quantity) return;

      setMaterials(updatedMaterials);

      await axios.put(`http://127.0.0.1:5000/api/materials/${material_id}`, {
        current_quantity: changed.current_quantity,
      });

      alert("Quantity removed successfully!");
    } catch (error) {
      alert(`Error subtracting quantity: ${error}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { material_id, transaction_type } = transaction;

    if (!material_id || isNaN(parseFloat(transaction.quantity))) {
      alert("Please select a material and enter a valid quantity.");
      return;
    }

    try {
      if (transaction_type === "addition") {
        await handleAddQuantity(material_id);
      } else if (transaction_type === "removal") {
        await handleSubtractQuantity(material_id);
      }

      await axios.post("http://127.0.0.1:5000/api/material-transactions", transaction);
      navigate("/material");
    } catch (error) {
      alert(`Error handling transaction: ${error}`);
    }
  };

  const handleCancel = () => {
    setTransaction({
      material_id: "",
      transaction_type: "addition",
      quantity: "",
      description: "",
    });
  };

  const [materialSelectOpen, setMaterialSelectOpen] = useState(false);
  const [transactionTypeSelectOpen, setTransactionTypeSelectOpen] = useState(false);

  const handleMaterialSelectOpen = () => setMaterialSelectOpen(true);
  const handleMaterialSelectClose = () => setMaterialSelectOpen(false);

  const handleTransactionTypeSelectOpen = () => setTransactionTypeSelectOpen(true);
  const handleTransactionTypeSelectClose = () => setTransactionTypeSelectOpen(false);


  return (
    <Box className="flex justify-center items-center min-h-screen bg-gray-50">
      <Paper elevation={3} className="p-6 w-full max-w-lg">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" gutterBottom className="font-semibold text-gray-700">
            Add Material Transaction
          </Typography>
          <IconButton
            onClick={() => navigate("/material")}
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
        </Box>

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="material-label">Material</InputLabel>
            <Select
              labelId="material-label"
              name="material_id"
              value={transaction.material_id}
              onChange={handleChange}
              open={materialSelectOpen}
              onOpen={handleMaterialSelectOpen}
              onClose={handleMaterialSelectClose}
            >
              <MenuItem value="">
                <em>Select a material</em>
              </MenuItem>
              {Array.isArray(materials) && materials.length > 0 ? (
                materials.map((mat) => (
                  <MenuItem key={mat.material_id} value={mat.material_id}>
                    {mat.title}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  No materials found
                </MenuItem>
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="transaction-type-label">Transaction Type</InputLabel>
            <Select
              labelId="transaction-type-label"
              name="transaction_type"
              value={transaction.transaction_type}
              onChange={handleChange}
              open={transactionTypeSelectOpen}
              onOpen={handleTransactionTypeSelectOpen}
              onClose={handleTransactionTypeSelectClose}
            >
              <MenuItem value="addition">Addition</MenuItem>
              <MenuItem value="removal">Removal</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Quantity"
            type="number"
            name="quantity"
            value={transaction.quantity}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            inputProps={{ step: "0.01", min: "0" }}
          />

          <TextField
            label="Description"
            name="description"
            value={transaction.description}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3, gap: 2 }}>
            <Button variant="outlined" sx={{ borderColor: "#1976d2", color: "#1976d2" }} onClick={() => navigate("/material")}>
              Back
            </Button>
            <Button variant="outlined" color="error" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Add Transaction
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default MaterialTransactionForm;
