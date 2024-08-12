'use client'
import { useState, useEffect } from "react";
import { firestore } from "@/firebase";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Button, Modal, Stack, TextField, Typography, AppBar, Toolbar, Container, Paper } from "@mui/material";
import { collection, deleteDoc, doc, getDocs, query, getDoc, setDoc } from 'firebase/firestore';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2c3e50',
    },
    secondary: {
      main: '#e74c3c',
    },
    background: {
      default: '#ecf0f1',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach(doc => {
      inventoryList.push({
        name: doc.id,
        ...doc.data()
      });
    });
    setInventory(inventoryList);
  }

  const addItem = async (item) => {
    const normalizedItem = item.toLowerCase();
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const quantity = Number(data.quantity);
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }

    await updateInventory();
  }
  
  const removeItem = async (item) => {
    const normalizedItem = item.toLowerCase();
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const quantity = Number(data.quantity);
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  }

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Inventory Management
            </Typography>
            <Button color="inherit" onClick={handleOpen} startIcon={<AddIcon />}>
              Add New Item
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Paper elevation={3}>
            <Box p={3}>
              <Typography variant="h4" color="primary" gutterBottom>
                Inventory Items
              </Typography>
              <Stack spacing={2}>
                {filteredInventory.map(({ name, quantity }) => (
                  <Paper key={name} elevation={1} sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </Typography>
                      <Box display="flex" alignItems="center">
                        <Typography variant="h6" sx={{ mr: 2 }}>
                          {quantity}
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => addItem(name)}
                          sx={{ mr: 1 }}
                        >
                          <AddIcon />
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          onClick={() => removeItem(name)}
                        >
                          <RemoveIcon />
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Paper>
        </Container>
        <Modal open={open} onClose={handleClose}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>Add Item</Typography>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                addItem(itemName);
                setItemName('');
                handleClose();
              }}
            >
              Add
            </Button>
          </Box>
        </Modal>
      </Box>
    </ThemeProvider>
  );
}
