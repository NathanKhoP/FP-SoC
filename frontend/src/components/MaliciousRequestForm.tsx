import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  MenuItem, 
  FormControl,
  Select,
  InputLabel,
  Alert,
  Grid
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { MaliciousRequestFormData } from '../types';
import { reportMaliciousRequest } from '../services/maliciousRequestService';

const MaliciousRequestForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

  const initialValues: MaliciousRequestFormData = {
    requestUrl: '',
    requestMethod: 'GET',
    requestHeaders: '{}',
    requestBody: '',
    sourceIp: '',
    description: ''
  };

  const validationSchema = Yup.object({
    requestUrl: Yup.string()
      .required('URL is required')
      .url('Must be a valid URL'),
    requestMethod: Yup.string()
      .required('HTTP method is required')
      .oneOf(httpMethods, 'Invalid HTTP method'),
    requestHeaders: Yup.string()
      .test('is-json', 'Headers must be in valid JSON format', (value) => {
        if (!value) return true;
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      }),
    requestBody: Yup.string(),
    sourceIp: Yup.string()
      .required('Source IP is required')
      .matches(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Must be a valid IPv4 address'),
    description: Yup.string()
      .required('Description is required')
      .min(20, 'Description must be at least 20 characters')
  });

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setSuccess(false);
      setError(null);

      try {
        await reportMaliciousRequest(values);
        setSuccess(true);
        formik.resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit report');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Report Malicious Request
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          The malicious request was successfully reported and is being analyzed by our system.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={formik.handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              id="requestUrl"
              name="requestUrl"
              label="Request URL"
              placeholder="https://example.com/vulnerable-endpoint"
              value={formik.values.requestUrl}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.requestUrl && Boolean(formik.errors.requestUrl)}
              helperText={formik.touched.requestUrl && formik.errors.requestUrl}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="requestMethod-label">HTTP Method</InputLabel>
              <Select
                labelId="requestMethod-label"
                id="requestMethod"
                name="requestMethod"
                value={formik.values.requestMethod}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.requestMethod && Boolean(formik.errors.requestMethod)}
                label="HTTP Method"
              >
                {httpMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              id="requestHeaders"
              name="requestHeaders"
              label="Request Headers (JSON format)"
              placeholder='{"Content-Type": "application/json", "Authorization": "Bearer xyz123"}'
              multiline
              rows={3}
              value={formik.values.requestHeaders}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.requestHeaders && Boolean(formik.errors.requestHeaders)}
              helperText={formik.touched.requestHeaders && formik.errors.requestHeaders}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              id="requestBody"
              name="requestBody"
              label="Request Body"
              placeholder="Request payload or body content"
              multiline
              rows={4}
              value={formik.values.requestBody}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.requestBody && Boolean(formik.errors.requestBody)}
              helperText={formik.touched.requestBody && formik.errors.requestBody}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="sourceIp"
              name="sourceIp"
              label="Source IP"
              placeholder="192.168.1.1"
              value={formik.values.sourceIp}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.sourceIp && Boolean(formik.errors.sourceIp)}
              helperText={formik.touched.sourceIp && formik.errors.sourceIp}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              id="description"
              name="description"
              label="Description"
              placeholder="Detailed description of the suspicious activity"
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
              margin="normal"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default MaliciousRequestForm;