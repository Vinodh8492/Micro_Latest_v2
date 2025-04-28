import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar
} from '@mui/material';
import { UploadFile, Image, AdminPanelSettings } from '@mui/icons-material';
import { LogoContext } from "../context/LogoContext";
import SMTPSettings from './SMTPSettings';
import ReportScheduler from './ReportScheduler';

const API_BASE = 'http://localhost:5173';

const AdminPage = () => {
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploadedLogo, setUploadedLogo] = useState('');
  const { logoUrl, setLogoUrl } = useContext(LogoContext);

  useEffect(() => {
    axios.get(`${API_BASE}/api/logo`)
      .then((res) => {
        if (res.data.logoUrl) {
          const fullUrl = `${API_BASE}${res.data.logoUrl}`;
          setUploadedLogo(fullUrl);
          setLogoUrl(fullUrl);
        }
      })
      .catch((err) => {
        console.error("Failed to load current logo:", err);
      });
  }, [setLogoUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!logo) return;
    const formData = new FormData();
    formData.append('logo', logo);

    try {
      const res = await axios.post(`${API_BASE}/api/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.logoUrl) {
        const fullUrl = `${API_BASE}${res.data.logoUrl}`;
        setUploadedLogo(fullUrl);
        setLogoUrl(fullUrl);
      }
      setLogo(null);
      setPreview('');
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <Box sx={{ width: '100%', px: 4, py: 4 }}>
      <Card sx={{ p: 4, boxShadow: 4 }}>
        <CardContent>

          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Avatar>
              <AdminPanelSettings />
            </Avatar>
            <Typography variant="h5" fontWeight={600}>
              Admin Panel - Upload Logo
            </Typography>
          </Stack>

          <Box mb={2}>
            <input
              accept="image/*"
              id="upload-logo"
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="upload-logo">
              <Button
                variant="contained"
                color="primary"
                component="span"
                startIcon={<Image />}
              >
                Choose File
              </Button>
            </label>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {logo ? logo.name : 'No file chosen'}
            </Typography>
          </Box>

          {preview && (
            <Box mb={2}>
              <Typography variant="subtitle2">Preview:</Typography>
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{ width: 150, height: 'auto', borderRadius: 1, boxShadow: 2 }}
              />
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadFile />}
            onClick={handleUpload}
            disabled={!logo}
            sx={{
              mb: 3,
              px: 2,
              py: 1,
              fontSize: '0.85rem',
              borderRadius: 1,
              minWidth: 160
            }}
          >
            Upload Logo
          </Button>

          {uploadedLogo && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Current Logo:
              </Typography>
              <Box mt={1}>
                <Box
                  component="img"
                  src={uploadedLogo}
                  alt="Current Logo"
                  sx={{ width: 150, height: 'auto', borderRadius: 1, boxShadow: 2 }}
                />
              </Box>
            </Box>
          )}

          <Box sx={{ my: 4 }}>
            <Typography variant="h6" fontWeight={600}>
              Email Configuration
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 4,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <SMTPSettings />
            </Box>
            <Box sx={{ flex: 1 }}>
              <ReportScheduler />
            </Box>
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminPage;
