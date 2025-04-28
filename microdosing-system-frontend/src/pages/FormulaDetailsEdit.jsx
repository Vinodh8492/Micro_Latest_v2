import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";

const FormulaEditForm = () => {
  const { recipe_id } = useParams();
  const [recipe, setRecipe] = useState({
    name: "",
    code: "",
    description: "",
    version: "",
    no_of_materials: "",
    materials: [], // To hold recipe materials
  });

  const [storageOptions, setStorageOptions] = useState([]);

  const [materialNames, setMaterialNames] = useState({});

  const [selectedMaterialIds, setSelectedMaterialIds] = useState({});

  useEffect(() => {
    const fetchMaterialNames = async () => {
      const materialNamesObj = {}; // To store material names

      // Loop through each material to fetch its name
      for (let material of recipe.materials) {
        try {
          const response = await axios.get(
            `http://127.0.0.1:5000/api/materials/${material.material_id}`
          );
          materialNamesObj[material.material_id] = response.data.title; // Save the name by material_id
        } catch (error) {
          console.error("Error fetching material name:", error);
        }
      }

      setMaterialNames(materialNamesObj); // Update state with all material names
    };

    if (recipe.materials.length > 0) {
      fetchMaterialNames();
    }
  }, [recipe.materials]); // Depend on materials array

  useEffect(() => {
    const fetchMaterialNames = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:5000/api/materials/all"
        );
        setStorageOptions(response.data); // Store the material names in storageOptions
      } catch (error) {
        console.error("Error fetching material names:", error);
      }
    };
    fetchMaterialNames();
  }, []);

  // Fetch storage options from API
  useEffect(() => {
    const fetchStorageOptions = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:5000/api/materials/all"
        );
        console.log("response :", response);
        setStorageOptions(response.data); // Store the storage options
      } catch (error) {
        console.error("Error fetching storage options", error);
      }
    };

    fetchStorageOptions();
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipeAndMaterials = async () => {
      try {
        // Step 1: Fetch recipe data
        const recipeResponse = await axios.get(
          `http://127.0.0.1:5000/api/recipes/${recipe_id}`
        );
        const fetchedRecipe = recipeResponse.data;

        // Extract no_of_materials from recipe data
        const noOfMaterials = fetchedRecipe.no_of_materials
          ? Number(fetchedRecipe.no_of_materials)
          : 0;

        setRecipe((prev) => ({
          ...prev,
          ...fetchedRecipe,
          no_of_materials: noOfMaterials,
        }));

        // Step 2: Fetch recipe materials data (check if there are any materials for this recipe_id)
        try {
          const materialsResponse = await axios.get(
            `http://127.0.0.1:5000/api/recipe_materials/${recipe_id}`
          );

          // If materials exist, set them to state
          if (materialsResponse.data.length > 0) {
            setRecipe((prev) => ({
              ...prev,
              materials: materialsResponse.data,
            }));
          } else {
            // No materials found, generate empty fields
            if (noOfMaterials > 0) {
              const emptyMaterials = Array.from(
                { length: noOfMaterials },
                (_, index) => ({
                  recipe_material_id: `new-${index}`, // temporary unique key
                  material_id: "",
                  storage: "",
                  set_point: "",
                })
              );

              setRecipe((prev) => ({
                ...prev,
                materials: emptyMaterials,
              }));
            }
          }
        } catch (materialsError) {
          console.error("Error fetching recipe materials:", materialsError);
          // Handle the error by showing empty fields if no data is found
          if (noOfMaterials > 0) {
            const emptyMaterials = Array.from(
              { length: noOfMaterials },
              (_, index) => ({
                recipe_material_id: `new-${index}`, // temporary unique key
                material_id: "",
                storage: "",
                set_point: "",
              })
            );

            setRecipe((prev) => ({
              ...prev,
              materials: emptyMaterials,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
      }
    };

    fetchRecipeAndMaterials();
  }, [recipe_id]);

  const handleChange = (e) => {
    setRecipe({ ...recipe, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const submissionPromises = recipe.materials.map((material) => {
        const {
          recipe_material_id,
          material_id,
          set_point,
          bucket_id,  // Add the bucket_id field here
        } = material;
  
        const payload = {
          recipe_id: parseInt(recipe_id, 10),
          material_id: parseInt(material_id, 10),
          set_point: parseFloat(set_point),
          actual: 0,                // Set based on UI or backend weight logic
          status: "Pending",        // Required by backend
          use_scale: false,         // Optional (false = manual actual)
          bucket_id: parseInt(bucket_id, 10),  // Pass bucket_id to the backend
        };
  
        const isNew = !recipe_material_id || isNaN(Number(recipe_material_id));
  
        // POST for new material
        if (isNew) {
          return axios.post(`http://127.0.0.1:5000/api/recipe_materials`, payload);
        }
  
        // PUT for existing material
        return axios.put(
          `http://127.0.0.1:5000/api/recipe_materials/${recipe_material_id}`,
          payload
        );
      });
  
      await Promise.all(submissionPromises);
      alert("Recipe materials saved successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Error saving materials:", error?.response?.data || error.message);
      alert("Failed to save some or all materials.");
    }
  };
  
  

  const handleCancel = () => {
    navigate(-1); // Navigate to the recipe list page or wherever you'd like
  };

  const handleStatusChange = (materialId) => {
    const updatedMaterials = recipe.materials.map((material) => {
      if (material.recipe_material_id === materialId) {
        return { ...material};
      }
      return material;
    });

    // Update the recipe materials state with the new status (you could also send this to the backend here)
    // setRecipe({ ...recipe, materials: updatedMaterials });
    console.log(updatedMaterials); // For now, just log the updated data
  };

  return (
    <Paper elevation={3} sx={{ maxWidth: 900, margin: "auto", mt: 4, p: 3 }}>
      {/* Recipe Materials Table */}
      <Box mt={4} p={3} sx={{ backgroundColor: "#f9f9f9", borderRadius: 2 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Edit Formula -{" "}
          <Box component="span" sx={{ fontWeight: "bold" }}>
            {recipe.name || "Recipe Details"}
          </Box>
        </Typography>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <TextField
            label="Margin"
            variant="outlined"
            defaultValue="5%"
            size="small"
            sx={{ width: 120 }}
          />
        </Box>

        {recipe.materials.length > 0 ? (
          <Table sx={{ mt: 2, border: "1px solid #ccc", borderRadius: 1 }}>
            <TableHead sx={{ backgroundColor: "#d6dce5" }}>
              <TableRow>
                <TableCell>
                  <strong>Reorder</strong>
                </TableCell>
                <TableCell>
                  <strong>Material</strong>
                </TableCell>
                <TableCell>
                  <strong>Storage</strong>
                </TableCell>
                <TableCell>
                  <strong>Set Point</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* Limit the number of rows based on no_of_materials */}
              {recipe.materials
                .slice(
                  0,
                  Math.min(recipe.no_of_materials, recipe.materials.length)
                )
                .map((material) => (
                  <TableRow key={material.recipe_material_id} hover>
                    {/* Reorder Placeholder */}
                    <TableCell>
                      <IconButton size="small">
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                    </TableCell>

                    {/* Material Dropdown */}
                    <TableCell>
                      <Select
                        fullWidth
                        value={
                          selectedMaterialIds[material.material_id] ||
                          material.material_id
                        }
                        onChange={(e) => {
                          const updatedMaterials = recipe.materials.map((mat) =>
                            mat.recipe_material_id ===
                            material.recipe_material_id
                              ? { ...mat, material_id: e.target.value }
                              : mat
                          );
                          setRecipe({ ...recipe, materials: updatedMaterials });
                        }}
                        size="small"
                      >
                        {storageOptions.map((matOpt) => (
                          <MenuItem
                            key={matOpt.material_id}
                            value={matOpt.material_id}
                          >
                            {matOpt.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    {/* Storage Dropdown */}
                    <TableCell>
                      <Select
                        fullWidth
                        value={material.storage || ""}
                        onChange={(e) => {
                          const updatedMaterials = recipe.materials.map((mat) =>
                            mat.recipe_material_id ===
                            material.recipe_material_id
                              ? { ...mat, storage: e.target.value }
                              : mat
                          );
                          setRecipe({ ...recipe, materials: updatedMaterials });
                        }}
                        displayEmpty
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          Select Storage
                        </MenuItem>
                        {storageOptions.map((storage) => (
                          <MenuItem
                            key={storage.id}
                            value={storage.plant_area_location}
                          >
                            {storage.plant_area_location}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    {/* Set Point Input */}
                    <TableCell>
                      <TextField
                        fullWidth
                        type="number"
                        variant="outlined"
                        size="small"
                        value={material.set_point}
                        onChange={(e) => {
                          const updatedMaterials = recipe.materials.map((mat) =>
                            mat.recipe_material_id ===
                            material.recipe_material_id
                              ? { ...mat, set_point: e.target.value }
                              : mat
                          );
                          setRecipe({ ...recipe, materials: updatedMaterials });
                        }}
                      />
                    </TableCell>

                  </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : (
          <Typography>No materials available for this recipe.</Typography>
        )}

        {/* Action Buttons */}
        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            SAVE
          </Button>

          <Button variant="outlined" color="error" onClick={() => navigate(-1)}>
            CANCEL
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default FormulaEditForm;
