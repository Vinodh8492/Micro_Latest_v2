import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
// Importing only the necessary components from @mui/material
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

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
    materials: [],
  });

  const [storageOptions, setStorageOptions] = useState([]);
  const [materialNames, setMaterialNames] = useState({});
  const [selectedMaterialIds, setSelectedMaterialIds] = useState({});

  useEffect(() => {
    const fetchMaterialNames = async () => {
      const materialNamesObj = {};

      for (let material of recipe.materials) {
        try {
          const response = await axios.get(
            `http://127.0.0.1:5000/api/materials/${material.material_id}`
          );
          materialNamesObj[material.material_id] = response.data.title;
        } catch (error) {
          console.error("Error fetching material name:", error);
        }
      }
      setMaterialNames(materialNamesObj);
    };

    if (recipe.materials.length > 0) {
      fetchMaterialNames();
    }
  }, [recipe.materials]);

  useEffect(() => {
    const fetchMaterialNames = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:5000/api/materials/all"
        );
        setStorageOptions(response.data);
      } catch (error) {
        console.error("Error fetching material names:", error);
      }
    };
    fetchMaterialNames();
  }, []);

  useEffect(() => {
    const fetchStorageOptions = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:5000/api/materials/all"
        );
        console.log("response :", response);
        setStorageOptions(response.data);
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
        const recipeResponse = await axios.get(
          `http://127.0.0.1:5000/api/recipes/${recipe_id}`
        );
        const fetchedRecipe = recipeResponse.data;

        const noOfMaterials = fetchedRecipe.no_of_materials
          ? Number(fetchedRecipe.no_of_materials)
          : 0;

        setRecipe((prev) => ({
          ...prev,
          ...fetchedRecipe,
          no_of_materials: noOfMaterials,
        }));

        try {
          const materialsResponse = await axios.get(
            `http://127.0.0.1:5000/api/recipe_materials/${recipe_id}`
          );

          if (materialsResponse.data.length > 0) {
            setRecipe((prev) => ({
              ...prev,
              materials: materialsResponse.data,
            }));
          } else {
            if (noOfMaterials > 0) {
              const emptyMaterials = Array.from(
                { length: noOfMaterials },
                (_, index) => ({
                  recipe_material_id: `new-${index}`,
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
          if (noOfMaterials > 0) {
            const emptyMaterials = Array.from(
              { length: noOfMaterials },
              (_, index) => ({
                recipe_material_id: `new-${index}`,
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submissionPromises = recipe.materials.map((material) => {
        const {
          recipe_material_id,
          material_id,
          set_point,
          bucket_id,
        } = material;

        const payload = {
          recipe_id: parseInt(recipe_id, 10),
          material_id: parseInt(material_id, 10),
          set_point: parseFloat(set_point),
          actual: 0,
          status: "Pending",
          use_scale: false,
          bucket_id: parseInt(bucket_id, 10),
        };

        const isNew = !recipe_material_id || isNaN(Number(recipe_material_id));

        if (isNew) {
          return axios.post(`http://127.0.0.1:5000/api/recipe_materials`, payload);
        }

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

  return (
    <Paper elevation={3} sx={{ maxWidth: 900, margin: "auto", mt: 4, p: 3 }}>

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
              {recipe.materials
                .slice(
                  0,
                  Math.min(recipe.no_of_materials, recipe.materials.length)
                )
                .map((material) => (
                  <TableRow key={material.recipe_material_id} hover>
                    <TableCell>
                      <IconButton size="small">
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                    </TableCell>

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
