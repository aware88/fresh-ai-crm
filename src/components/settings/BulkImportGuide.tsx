'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, FileText, File, Download, HelpCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function BulkImportGuide() {
  return (
    <Card className="shadow-sm border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm mr-3">
            <Info className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Bulk Import Guide</CardTitle>
            <p className="text-sm text-gray-600">
              Learn how to format your files for successful data imports
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="prices">Prices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Supported File Formats</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center mb-2">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600 mr-2" />
                    <h4 className="font-medium">Excel Files (.xlsx, .xls)</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Best for structured data with multiple columns. Can contain multiple sheets, but only the first sheet will be processed.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center mb-2">
                    <File className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-medium">CSV Files (.csv)</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Simple format for tabular data. Must include a header row with column names. Values should be comma-separated.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-medium">Word Files (.docx, .doc)</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Can extract data from tables in Word documents or from structured text with key-value pairs (e.g., "Name: John Doe").
                  </p>
                </div>
              </div>
              
              <h3 className="text-lg font-medium mt-6">General Guidelines</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Files should contain <strong>headers in the first row</strong> that identify each column</li>
                <li>Column headers are <strong>case-insensitive</strong> (e.g., "Name", "name", or "NAME" are all recognized)</li>
                <li>If required fields are missing, those records will be skipped with an error message</li>
                <li>The system will attempt to match columns to the appropriate fields based on header names</li>
                <li>For best results, use the template formats provided in each entity tab</li>
                <li>Maximum file size: <strong>10MB</strong></li>
              </ul>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
                <div className="flex">
                  <HelpCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Need Help?</h4>
                    <p className="text-sm text-amber-700">
                      If you encounter any issues during the import process, check the error messages for specific guidance. Common issues include missing required fields, duplicate records, or formatting problems.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="contacts" className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Contact Import Format</h3>
                <Button variant="outline" size="sm" className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download Template
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Field</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Required</TableHead>
                      <TableHead className="w-[150px]">Example</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">name</TableCell>
                      <TableCell>Full name of the contact</TableCell>
                      <TableCell>Yes*</TableCell>
                      <TableCell>John Doe</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">email</TableCell>
                      <TableCell>Email address</TableCell>
                      <TableCell>Yes*</TableCell>
                      <TableCell>john@example.com</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">phone</TableCell>
                      <TableCell>Phone number</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>+1 555-123-4567</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">company</TableCell>
                      <TableCell>Company or organization name</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>Acme Inc.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">title</TableCell>
                      <TableCell>Job title or position</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>Sales Manager</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">address</TableCell>
                      <TableCell>Physical address</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>123 Main St, City</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">notes</TableCell>
                      <TableCell>Additional notes or comments</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>Met at conference</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <p className="text-xs text-gray-600 mt-2">* Either name or email is required for each contact</p>
              
              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="example">
                  <AccordionTrigger>View Example CSV Format</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto">
                      name,email,phone,company,title,address,notes<br/>
                      John Doe,john@example.com,+1 555-123-4567,Acme Inc.,CEO,123 Main St,Key decision maker<br/>
                      Jane Smith,jane@example.com,+1 555-987-6543,XYZ Corp.,CTO,456 Oak Ave,Technical contact<br/>
                      ,support@company.com,+1 800-555-1234,Company LLC,Support,789 Pine St,General support email
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
          
          <TabsContent value="suppliers" className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Supplier Import Format</h3>
                <Button variant="outline" size="sm" className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download Template
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Field</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Required</TableHead>
                      <TableHead className="w-[150px]">Example</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">name</TableCell>
                      <TableCell>Name of the supplier</TableCell>
                      <TableCell>Yes</TableCell>
                      <TableCell>ABC Distributors</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">email</TableCell>
                      <TableCell>Contact email address</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>orders@abcdist.com</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">phone</TableCell>
                      <TableCell>Contact phone number</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>+1 555-789-0123</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">website</TableCell>
                      <TableCell>Supplier website URL</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>https://abcdist.com</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">address</TableCell>
                      <TableCell>Physical address</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>789 Industry Blvd</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">notes</TableCell>
                      <TableCell>Additional information</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>Preferred supplier</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="example">
                  <AccordionTrigger>View Example CSV Format</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto">
                      name,email,phone,website,address,notes<br/>
                      ABC Distributors,orders@abcdist.com,+1 555-789-0123,https://abcdist.com,789 Industry Blvd,Preferred supplier<br/>
                      Global Supply Co.,contact@globalsupply.com,+1 555-456-7890,https://globalsupply.com,456 Commerce St,Net 30 terms<br/>
                      Local Manufacturers,info@localmfg.com,+1 555-321-6540,https://localmfg.com,123 Factory Rd,Local pickup available
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
          
          <TabsContent value="products" className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Product Import Format</h3>
                <Button variant="outline" size="sm" className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download Template
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Field</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Required</TableHead>
                      <TableHead className="w-[150px]">Example</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">name</TableCell>
                      <TableCell>Product name</TableCell>
                      <TableCell>Yes</TableCell>
                      <TableCell>Ergonomic Chair</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">sku</TableCell>
                      <TableCell>Stock keeping unit (unique identifier)</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>CHAIR-001</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">description</TableCell>
                      <TableCell>Product description</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>Adjustable office chair</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">price</TableCell>
                      <TableCell>Base price (numeric value)</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>199.99</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">category</TableCell>
                      <TableCell>Product category</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>Office Furniture</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="example">
                  <AccordionTrigger>View Example CSV Format</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto">
                      name,sku,description,price,category<br/>
                      Ergonomic Chair,CHAIR-001,Adjustable office chair with lumbar support,199.99,Office Furniture<br/>
                      Standing Desk,DESK-002,Electric height-adjustable desk,349.99,Office Furniture<br/>
                      Wireless Mouse,ACC-101,Bluetooth wireless mouse,29.99,Accessories
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
          
          <TabsContent value="prices" className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Price Import Format</h3>
                <Button variant="outline" size="sm" className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download Template
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Field</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Required</TableHead>
                      <TableHead className="w-[150px]">Example</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">product_id</TableCell>
                      <TableCell>Product ID in the system</TableCell>
                      <TableCell>Yes*</TableCell>
                      <TableCell>123</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">product_sku</TableCell>
                      <TableCell>Product SKU (alternative to product_id)</TableCell>
                      <TableCell>Yes*</TableCell>
                      <TableCell>CHAIR-001</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">price</TableCell>
                      <TableCell>Price amount (numeric value)</TableCell>
                      <TableCell>Yes</TableCell>
                      <TableCell>199.99</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">currency</TableCell>
                      <TableCell>Currency code</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>USD</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">effective_date</TableCell>
                      <TableCell>Date when price becomes effective</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>2025-07-15</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <p className="text-xs text-gray-600 mt-2">* Either product_id or product_sku is required for each price record</p>
              
              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="example">
                  <AccordionTrigger>View Example CSV Format</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto">
                      product_sku,price,currency,effective_date<br/>
                      CHAIR-001,199.99,USD,2025-07-15<br/>
                      DESK-002,349.99,USD,2025-07-15<br/>
                      ACC-101,29.99,USD,2025-07-15
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
