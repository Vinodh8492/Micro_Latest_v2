import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
// Importing only the necessary components from @mui/material
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';

import CloseIcon from "@mui/icons-material/Close";

const EditMaterial = () => {
  const { material_id } = useParams();
  const navigate = useNavigate();
  
  const [material, setMaterial] = useState({
    title: "",
    description: "",
    unit_of_measure: "",
    plant_area_location: "",
  });
  const [initialMaterial, setInitialMaterial] = useState(null);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:5000/api/materials/${material_id}`)
      .then((response) => {
        setMaterial(response.data);
        setInitialMaterial(response.data);
      })
      .catch((error) => alert(`Error fetching material: ${error}`));
  }, [material_id]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/api/materials/all")
      .then((response) => {
        const uniqueLocations = [
          ...new Set(response.data.map((item) => item.plant_area_location)),
        ];
        setLocations(uniqueLocations);
      })
      .catch((error) => alert(`Error fetching locations: ${error}`));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMaterial((prev) => ({ ...prev, [name]: value }));
  };
  const handleLocationChange = (_, newValue) => {
    setMaterial((prev) => ({ ...prev, plant_area_location: newValue || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://127.0.0.1:5000/api/materials/${material_id}`,
        material
      );
      Swal.fire("Updated!", "Material updated successfully.", "success");
      navigate(-1);
    } catch (error) {
      Swal.fire("Error!", "Failed to update material.", "error");
    }
  };

  const handleCancel = () => {
    if (initialMaterial) {
      setMaterial({
        title: "",
        description: "",
        unit_of_measure: "",
        plant_area_location: "",
      });
    }
  };

  return (
    <Box className="flex justify-center items-center min-h-screen bg-gray-50">
      <Paper elevation={3} className="p-6 w-full max-w-md">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5" className="font-semibold text-gray-700">
            Edit Material
          </Typography>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              border: "1px solid red",
              borderRadius: "50%",
              padding: "6px",
              height: "40px",
              width: "40px",
            }}
          >
            <CloseIcon sx={{ color: "red" }} />
          </IconButton>
        </Box>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            name="title"
            value={material.title}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Description"
            name="description"
            value={material.description}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Unit of Measurement"
            name="unit_of_measure"
            value={material.unit_of_measure}
            onChange={handleChange}
            fullWidth
            required
            sx={{ marginBottom: "10px" }}
          />

          <Autocomplete
            options={locations}
            value={material.plant_area_location || ""}
            onChange={handleLocationChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Storage"
                variant="outlined"
                fullWidth
                required
              />
            )}
            disableClearable
            getOptionLabel={(option) => option || ""}
            sx={{
              "& .MuiAutocomplete-inputRoot": {
                padding: "10px 12px",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
              },
            }}
          />
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{ borderColor: "#4B5563", color: "#4B5563" }}
            >
              Back
            </Button>
            <Button variant="outlined" onClick={handleCancel} color="error">
              Cancel
            </Button>
            <Button variant="contained" type="submit" color="primary">
              Update
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default EditMaterial;
