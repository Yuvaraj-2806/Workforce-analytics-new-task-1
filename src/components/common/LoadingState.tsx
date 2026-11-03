import React from 'react';
import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

export const LoadingState: React.FC = () => {
  return (
    <Box>
      {/* KPI Skeletons */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={i}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Skeleton variant="circular" width={44} height={44} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="50%" height={44} />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="90%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Chart Skeletons */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Skeleton variant="text" width="30%" height={32} />
              <Skeleton variant="rectangular" width="100%" height={280} sx={{ borderRadius: 2, mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Skeleton variant="text" width="40%" height={32} />
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Skeleton variant="circular" width={180} height={180} />
              </Box>
              <Skeleton variant="text" width="100%" sx={{ mt: 2 }} />
              <Skeleton variant="text" width="80%" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoadingState;
