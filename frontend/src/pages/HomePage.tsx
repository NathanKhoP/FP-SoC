import React from 'react';
import { Container, Box, Grid, Typography, Button } from '@mui/material';
import mascotGif from '../assets/mascot.gif';
import '../styles/animations.css';

const HomePage: React.FC = () => {
  return (
    <Container maxWidth={false}>
      <Box>
        {/* Hero Section */}
        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid 
            item 
            xs={12} 
            md={8} 
            sx={{ order: { xs: 2, md: 1 } }}
          >
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              {/* Main Title */}
              <Typography 
                className="title-slide-in"
                variant="h2" 
                component="h1"
                sx={{ 
                  fontSize: { 
                    xs: '1.8rem', 
                    sm: '2.2rem', 
                    md: '2.8rem', 
                    lg: '3.4rem' 
                  },
                  fontWeight: 600,
                  mb: 2
                }}
              >
                IP Monitoring System
              </Typography>

              {/* Subtitle */}
              <Typography 
                className="subtitle-fade-in"
                variant="h5"
                sx={{ 
                  fontSize: { 
                    xs: '1.1rem', 
                    sm: '1.3rem', 
                    md: '1.5rem', 
                    lg: '1.8rem' 
                  },
                  width: { xs: '100%', md: '80%' },
                  mb: 3
                }}
              >
                With AI-powered cybersecurity assistant
              </Typography>

              {/* Description */}
              <Typography 
                className="subtitle-fade-in"
                sx={{
                  fontSize: { 
                    xs: '0.9rem', 
                    sm: '1rem', 
                    md: '1.1rem', 
                    lg: '1.2rem' 
                  },
                  lineHeight: { xs: 1.5, md: 1.6 },
                  mb: 4,
                  width: { xs: '100%', md: '78%' },
                  justifyContent: { xs: 'center', md: 'flex-start' }
                }}
              >
                This system enables security teams to monitor IP addresses for suspicious activity.
                Our AI-powered assistant helps analyze threats and provides recommendations for mitigation.
              </Typography>
                {/* Action Buttons */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                justifyContent: { xs: 'center', md: 'flex-start' }
              }}>
                <Button 
                  className="monitor-button"
                  variant="contained" 
                  size="large" 
                  component="a" 
                  href="/monitor"
                  sx={{
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                    minWidth: '200px'
                  }}
                >
                  Monitor IP Addresses
                </Button>
                
                <Button 
                  className="assistant-button"
                  variant="outlined" 
                  size="large" 
                  component="a" 
                  href="/chatbot"
                  sx={{
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                    minWidth: '200px'
                  }}
                >
                  Ask Security Assistant
                </Button>
              </Box>
            </Box>
          </Grid>          {/* Mascot Section */}
          <Grid 
            item 
            xs={12} 
            md={4} 
            sx={{ 
              order: { xs: 1, md: 2 },
              display: 'flex',
              justifyContent: { xs: 'center', md: 'flex-start' },
              alignItems: { xs: 'center', md: 'flex-start' },
              pl: { md: 0 },
              pt: { md: 0 }
            }}
          >            <Box 
              className="mascot-container"
              sx={{
                position: 'relative',
                transform: { 
                  md: 'translate(-10px, -20px)',
                  lg: 'translate(-100px, -10px)', 
                  xl: 'translate(-20px, -30px)' 
                }
              }}
            ><Box
                className="mascot-background"
                sx={{
                  width: { 
                    xs: 180, 
                    sm: 200, 
                    md: 300, 
                    lg: 450, 
                    xl: 500 
                  },
                  height: { 
                    xs: 180, 
                    sm: 200, 
                    md: 310, 
                    lg: 400, 
                    xl: 500 
                  },
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <img 
                  className="mascot-image mascot-float"
                  src={mascotGif} 
                  alt="Security Mascot" 
                  style={{ 
                    width: '90%', 
                    height: '90%',
                    objectFit: 'contain',
                    objectPosition: 'center',
                  }} 
                />
              </Box>
            </Box>
          </Grid>
        </Grid>        {/* Features Section */}
        <Box sx={{ mt: 10 }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontSize: { 
                xs: '1.6rem', 
                sm: '2rem', 
                md: '2.5rem', 
                lg: '3rem' 
              },
              fontWeight: 600,
              textAlign: 'center',
              mb: 4
            }}
          >
            Key Features
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center',
            gap: 2
          }}>
            {/* Feature Card 1 */}
            <Box 
              className="feature-card feature-card-1"
              sx={{ 
                flex: '1 1 300px', 
                border: '1px solid #ddd', 
                borderRadius: 2,
                minWidth: { xs: '280px', sm: '300px' },
                p: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Automated IP Monitoring
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                  lineHeight: { xs: 1.4, md: 1.6 },
                  color: 'text.secondary'
                }}
              >
                Continuous monitoring of IP addresses with port scanning, traffic analysis, and suspicious activity detection.
              </Typography>
            </Box>

            {/* Feature Card 2 */}
            <Box 
              className="feature-card feature-card-2"
              sx={{ 
                flex: '1 1 300px', 
                border: '1px solid #ddd', 
                borderRadius: 2,
                minWidth: { xs: '280px', sm: '300px' },
                p: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  fontWeight: 600,
                  mb: 2
                }}
              >
                AI-Powered Analysis
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                  lineHeight: { xs: 1.4, md: 1.6 },
                  color: 'text.secondary'
                }}
              >
                Advanced Groq LLM integration automatically analyzes detected threats and provides actionable insights.
              </Typography>
            </Box>

            {/* Feature Card 3 */}
            <Box 
              className="feature-card feature-card-3"
              sx={{ 
                flex: '1 1 300px', 
                border: '1px solid #ddd', 
                borderRadius: 2,
                minWidth: { xs: '280px', sm: '300px' },
                p: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Security Expert Chatbot
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                  lineHeight: { xs: 1.4, md: 1.6 },
                  color: 'text.secondary'
                }}
              >
                Get immediate assistance from our AI security assistant with access to monitoring logs.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
