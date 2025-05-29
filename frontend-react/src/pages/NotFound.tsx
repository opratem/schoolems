import React from "react";
import { Container, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Container maxWidth="md">
      <Typography color="error" variant="h4" sx={{ mt: 8 }} align="center">
        404 - Page Not Found
      </Typography>
    </Container>
  );
}
