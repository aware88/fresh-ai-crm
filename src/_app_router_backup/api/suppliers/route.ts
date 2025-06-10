import { NextRequest, NextResponse } from 'next/server';
import { initializeSupplierData } from '@/lib/suppliers/init';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Supplier } from '@/types/supplier';

// Path to store supplier data
const suppliersPath = path.join(process.cwd(), 'src/data/suppliers.json');
const dataDir = path.join(process.cwd(), 'src/data');

// Initialize suppliers file if it doesn't exist
const initSuppliersFile = () => {
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(suppliersPath)) {
    fs.writeFileSync(suppliersPath, JSON.stringify([]));
  }
};

// Get all suppliers
export async function GET() {
  // Ensure data files are initialized
  await initializeSupplierData();
  try {
    initSuppliersFile();
    const suppliersData = fs.readFileSync(suppliersPath, 'utf8');
    const suppliers = JSON.parse(suppliersData);
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

// Create a new supplier
export async function POST(request: NextRequest) {
  // Ensure data files are initialized
  await initializeSupplierData();
  try {
    const { name, email, phone, website, notes } = await request.json();
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    initSuppliersFile();
    const suppliersData = fs.readFileSync(suppliersPath, 'utf8');
    const suppliers: Supplier[] = JSON.parse(suppliersData);
    
    // Check if supplier with same email already exists
    const existingSupplier = suppliers.find(s => s.email === email);
    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this email already exists', supplierId: existingSupplier.id },
        { status: 409 }
      );
    }
    
    const newSupplier: Supplier = {
      id: uuidv4(),
      name,
      email,
      phone,
      website,
      notes,
      reliabilityScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    suppliers.push(newSupplier);
    fs.writeFileSync(suppliersPath, JSON.stringify(suppliers, null, 2));
    
    return NextResponse.json(newSupplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}

// Update an existing supplier by ID
export async function PUT(request: NextRequest) {
  // Ensure data files are initialized
  await initializeSupplierData();
  try {
    const { id, name, email, phone, website, notes, reliabilityScore } = await request.json();
    
    if (!id || !name || !email) {
      return NextResponse.json(
        { error: 'ID, name and email are required' },
        { status: 400 }
      );
    }
    
    initSuppliersFile();
    const suppliersData = fs.readFileSync(suppliersPath, 'utf8');
    let suppliers: Supplier[] = JSON.parse(suppliersData);
    
    // Find supplier by ID
    const supplierIndex = suppliers.findIndex(s => s.id === id);
    if (supplierIndex === -1) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    // Update supplier
    const updatedSupplier: Supplier = {
      ...suppliers[supplierIndex],
      name,
      email,
      phone,
      website,
      notes,
      reliabilityScore: reliabilityScore !== undefined ? reliabilityScore : suppliers[supplierIndex].reliabilityScore,
      updatedAt: new Date()
    };
    
    suppliers[supplierIndex] = updatedSupplier;
    fs.writeFileSync(suppliersPath, JSON.stringify(suppliers, null, 2));
    
    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

// Delete a supplier by ID
export async function DELETE(request: NextRequest) {
  // Ensure data files are initialized
  await initializeSupplierData();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }
    
    initSuppliersFile();
    const suppliersData = fs.readFileSync(suppliersPath, 'utf8');
    let suppliers: Supplier[] = JSON.parse(suppliersData);
    
    // Find supplier by ID
    const supplierIndex = suppliers.findIndex(s => s.id === id);
    if (supplierIndex === -1) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    // Remove supplier
    suppliers.splice(supplierIndex, 1);
    fs.writeFileSync(suppliersPath, JSON.stringify(suppliers, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
