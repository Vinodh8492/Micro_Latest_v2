import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
// Importing only the necessary components from @mui/material
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';

import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';

const FormulaViewDetails = () => {
  const { recipe_id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState({
    name: "",
    code: "",
    description: "",
    version: "",
    no_of_materials: 0,
    materials: []
  });
  const [materialNames, setMaterialNames] = useState({});

  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        const recipeResponse = await axios.get(`http://127.0.0.1:5000/api/recipes/${recipe_id}`);
        const fetchedRecipe = recipeResponse.data;
        const noOfMaterials = fetchedRecipe.no_of_materials ? Number(fetchedRecipe.no_of_materials) : 0;

        setRecipe((prev) => ({
          ...prev,
          ...fetchedRecipe,
          no_of_materials: noOfMaterials
        }));

        const materialsResponse = await axios.get(`http://127.0.0.1:5000/api/recipe_materials/${recipe_id}`);
        const materials = materialsResponse.data;

        setRecipe((prev) => ({
          ...prev,
          materials: materials
        }));

        const namesMap = {};
        for (let material of materials) {
          try {
            const res = await axios.get(`http://127.0.0.1:5000/api/materials/${material.material_id}`);
            namesMap[material.material_id] = res.data.title;
          } catch (error) {
            console.error("Error fetching material name", error);
          }
        }
        setMaterialNames(namesMap);
      } catch (error) {
        console.error("Error fetching recipe or materials", error);
      }
    };
    fetchRecipeData();
  }, [recipe_id]);

  return (
    <Paper elevation={3} sx={{ maxWidth: 900, margin: "auto", mt: 4, p: 3 }}>
      <Typography variant="h6" align="center" gutterBottom>
        Formula Details
      </Typography>

      <Box mb={3}>
        <Typography><strong>Name:</strong> {recipe.name}</Typography>
        <Typography><strong>Code:</strong> {recipe.code}</Typography>
        <Typography><strong>Description:</strong> {recipe.description}</Typography>
        <Typography><strong>Version:</strong> {recipe.version}</Typography>
      </Box>

      <Box mt={2}>
        {recipe.materials.length > 0 ? (
          <Table sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
            <TableHead sx={{ backgroundColor: '#d6dce5' }}>
              <TableRow>
                <TableCell><strong>Reorder</strong></TableCell>
                <TableCell><strong>Material</strong></TableCell>
                <TableCell><strong>Storage</strong></TableCell>
                <TableCell><strong>Set Point</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recipe.materials.map((material) => (
                <TableRow key={material.recipe_material_id}>
                  <TableCell>
                    <IconButton size="small" disabled><ArrowUpward fontSize="small" /></IconButton>
                    <IconButton size="small" disabled><ArrowDownward fontSize="small" /></IconButton>
                  </TableCell>
                  <TableCell>{materialNames[material.material_id] || material.material_id}</TableCell>
                  <TableCell>{material.plant_area_location}</TableCell>
                  <TableCell>{material.set_point}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography align="center">No materials found for this formula.</Typography>
        )}
      </Box>

      <Box mt={4} display="flex" justifyContent="center">
        <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
      </Box>
    </Paper>
  );
};

export default FormulaViewDetails;