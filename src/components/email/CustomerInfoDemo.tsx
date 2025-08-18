'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CustomerInfoWidget from './CustomerInfoWidget';
import CustomerNotes from './CustomerNotes';
import CustomerSidebar from './CustomerSidebar';
import CollaborationDashboard from '../collaboration/CollaborationDashboard';
import { TeamCollaborationProvider } from '../collaboration/TeamCollaborationProvider';
import { Mail, User, StickyNote, Sidebar, Users } from 'lucide-react';

export default function CustomerInfoDemo() {
    const [testEmail, setTestEmail] = useState('john.doe@example.com');
    const [showWidget, setShowWidget] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [demoMode, setDemoMode] = useState<'widget' | 'notes' | 'sidebar' | 'collaboration'>('widget');

    const sampleScenarios = [
        {
            email: 'john.doe@example.com',
            scenario: 'Loyal Customer',
            description: 'High-value customer with multiple orders'
        },
        {
            email: 'sarah.smith@company.com',
            scenario: 'New Customer',
            description: 'First-time buyer, great opportunity'
        },
        {
            email: 'mike.johnson@business.org',
            scenario: 'Re-engagement',
            description: 'Haven\'t ordered in months'
        },
        {
            email: 'anna.wilson@startup.io',
            scenario: 'Regular Customer',
            description: 'Consistent buyer, good relationship'
        }
    ];

    return (
        <TeamCollaborationProvider>
            <div className="space-y-6 p-6 max-w-6xl mx-auto">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">📧 Customer Info Widget Demo</h2>
                    <p className="text-gray-600">
                        See how customer information from Metakocka appears when viewing emails
                    </p>
                </div>

                {/* Demo Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <User className="h-5 w-5" />
                            <span>Test Customer Lookup</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="email">Customer Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="Enter customer email address"
                            />
                        </div>

                        <div className="space-y-2">
                            <span className="text-sm text-gray-600">Quick test scenarios:</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {sampleScenarios.map((scenario) => (
                                    <Button
                                        key={scenario.email}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTestEmail(scenario.email)}
                                        className="text-left p-3 h-auto flex flex-col items-start"
                                    >
                                        <div className="font-medium text-xs">{scenario.scenario}</div>
                                        <div className="text-xs text-gray-500 truncate w-full">{scenario.email}</div>
                                        <div className="text-xs text-gray-400">{scenario.description}</div>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                onClick={() => {
                                    setDemoMode('widget');
                                    setShowWidget(true);
                                }}
                                variant={demoMode === 'widget' ? 'default' : 'outline'}
                                className="flex-1"
                            >
                                <User className="h-4 w-4 mr-2" />
                                Customer Info
                            </Button>
                            <Button
                                onClick={() => {
                                    setDemoMode('notes');
                                    setShowWidget(true);
                                }}
                                variant={demoMode === 'notes' ? 'default' : 'outline'}
                                className="flex-1"
                            >
                                <StickyNote className="h-4 w-4 mr-2" />
                                Team Notes
                            </Button>
                            <Button
                                onClick={() => {
                                    setDemoMode('sidebar');
                                    setShowWidget(true);
                                    setShowSidebar(true);
                                }}
                                variant={demoMode === 'sidebar' ? 'default' : 'outline'}
                                className="flex-1"
                            >
                                <Sidebar className="h-4 w-4 mr-2" />
                                Full Sidebar
                            </Button>
                            <Button
                                onClick={() => {
                                    setDemoMode('collaboration');
                                    setShowWidget(false);
                                    setShowSidebar(false);
                                }}
                                variant={demoMode === 'collaboration' ? 'default' : 'outline'}
                                className="flex-1"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Team Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Collaboration Dashboard */}
                {demoMode === 'collaboration' && (
                    <div className="mt-6">
                        <CollaborationDashboard customerEmail={testEmail} />
                    </div>
                )}

                {/* Mock Email Interface */}
                {showWidget && demoMode !== 'collaboration' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Email Content (Left/Main) */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center space-x-2">
                                        <Mail className="h-5 w-5" />
                                        <span>Sample Email</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Email Header */}
                                    <div className="border-b pb-4 space-y-2">
                                        <div className="flex">
                                            <span className="w-16 font-medium text-sm">From:</span>
                                            <span className="text-sm">{testEmail}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-16 font-medium text-sm">To:</span>
                                            <span className="text-sm">support@withcar.com</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-16 font-medium text-sm">Subject:</span>
                                            <span className="text-sm">Question about my recent order</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-16 font-medium text-sm">Date:</span>
                                            <span className="text-sm">{new Date().toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Customer Info Widget Integration */}
                                    <div className="mt-3 space-y-3">
                                        <CustomerInfoWidget
                                            customerEmail={testEmail}
                                            className="max-w-md"
                                        />

                                        {demoMode === 'notes' && (
                                            <CustomerNotes
                                                customerEmail={testEmail}
                                                className="max-w-md"
                                            />
                                        )}
                                    </div>

                                    {/* Email Body */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium mb-2">Email Content:</h4>
                                        <div className="text-sm text-gray-700 space-y-2">
                                            <p>Hi there,</p>
                                            <p>
                                                I have a question about my recent order. Could you please help me
                                                track the shipment status? I'm expecting it to arrive soon.
                                            </p>
                                            <p>
                                                Also, I'm interested in similar products. Do you have any
                                                recommendations based on my purchase history?
                                            </p>
                                            <p>Thanks for your help!</p>
                                            <p>Best regards</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">💡 Integration Benefits</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs space-y-2">
                                    <p><strong>Customer Context:</strong> See order history instantly</p>
                                    <p><strong>Team Collaboration:</strong> Real-time notes and mentions</p>
                                    <p><strong>Efficiency:</strong> No need to switch between systems</p>
                                    <p><strong>Insights:</strong> Track team activity and performance</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">🚀 Collaboration Features</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs space-y-2">
                                    <p><strong>Team Notes:</strong> Collaborative notes with mentions and reactions</p>
                                    <p><strong>Real-time Activity:</strong> See what your team is working on</p>
                                    <p><strong>Presence Indicators:</strong> Know who's online and available</p>
                                    <p><strong>Smart Filtering:</strong> Find relevant information quickly</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Customer Sidebar Demo */}
                <CustomerSidebar
                    customerEmail={testEmail}
                    isOpen={showSidebar}
                    onClose={() => setShowSidebar(false)}
                />

                {/* Reset Demo */}
                {(showWidget || demoMode === 'collaboration') && (
                    <div className="text-center">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowWidget(false);
                                setShowSidebar(false);
                                setDemoMode('widget');
                            }}
                        >
                            Reset Demo
                        </Button>
                    </div>
                )}
            </div>
        </TeamCollaborationProvider>
    );
}