/**
 * Initialization functions for supplier management data
 */
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

/**
 * Ensure all required directories and files exist for supplier management
 */
export const initializeSupplierData = async () => {
  try {
    const dataDir = path.join(process.cwd(), 'src', 'data');
    const uploadsDir = path.join(dataDir, 'uploads', 'suppliers');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      await fsPromises.mkdir(dataDir, { recursive: true });
    }
    
    // Create uploads directory for supplier documents if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      await fsPromises.mkdir(uploadsDir, { recursive: true });
    }
    
    // Initialize suppliers.json if it doesn't exist
    const suppliersFilePath = path.join(dataDir, 'suppliers.json');
    if (!fs.existsSync(suppliersFilePath)) {
      await fsPromises.writeFile(suppliersFilePath, JSON.stringify([], null, 2));
    }
    
    // Initialize supplier_documents.json if it doesn't exist
    const documentsFilePath = path.join(dataDir, 'supplier_documents.json');
    if (!fs.existsSync(documentsFilePath)) {
      await fsPromises.writeFile(documentsFilePath, JSON.stringify([], null, 2));
    }
    
    // Initialize supplier_emails.json if it doesn't exist
    const emailsFilePath = path.join(dataDir, 'supplier_emails.json');
    if (!fs.existsSync(emailsFilePath)) {
      await fsPromises.writeFile(emailsFilePath, JSON.stringify([], null, 2));
    }
    
    // Initialize supplier_queries.json if it doesn't exist
    const queriesFilePath = path.join(dataDir, 'supplier_queries.json');
    if (!fs.existsSync(queriesFilePath)) {
      await fsPromises.writeFile(queriesFilePath, JSON.stringify([], null, 2));
    }
    
    console.log('Supplier data directories and files initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing supplier data:', error);
    return false;
  }
};
