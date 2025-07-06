"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, CheckCircle, Copy, RefreshCw, ShieldCheck } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";

interface TwoFactorAuthSetupProps {
  userId: string;
  userEmail: string;
}

interface BackupCode {
  code: string;
  used: boolean;
}

export function TwoFactorAuthSetup({ userId, userEmail }: TwoFactorAuthSetupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [step, setStep] = useState<'initial' | 'setup' | 'verify' | 'complete'>('initial');
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false);
  
  // Check if 2FA is already enabled
  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const response = await fetch('/api/user/two-factor-auth/status');
        const data = await response.json();
        setIs2FAEnabled(data.enabled);
      } catch (error) {
        console.error('Error checking 2FA status:', error);
      }
    };
    
    check2FAStatus();
  }, []);
  
  // Generate QR code when otpauth changes
  useEffect(() => {
    if (otpauth) {
      generateQRCode(otpauth);
    }
  }, [otpauth]);
  
  // Generate QR code from otpauth URL
  const generateQRCode = async (otpauthUrl: string) => {
    try {
      const url = await QRCode.toDataURL(otpauthUrl);
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code');
    }
  };
  
  // Start 2FA setup
  const startSetup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/two-factor-auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set up 2FA');
      }
      
      const data = await response.json();
      setSecretKey(data.secretKey);
      setOtpauth(data.otpauth);
      setStep('setup');
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      setError(error instanceof Error ? error.message : 'Failed to set up 2FA');
    } finally {
      setLoading(false);
    }
  };
  
  // Verify token and enable 2FA
  const verifyToken = async () => {
    if (!token || token.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/two-factor-auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify code');
      }
      
      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setIs2FAEnabled(true);
      setStep('complete');
      setSuccess('Two-factor authentication enabled successfully');
    } catch (error) {
      console.error('Error verifying token:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };
  
  // Disable 2FA
  const disable2FA = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/two-factor-auth/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disable 2FA');
      }
      
      setIs2FAEnabled(false);
      setStep('initial');
      setSuccess('Two-factor authentication disabled successfully');
      setToken('');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setError(error instanceof Error ? error.message : 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };
  
  // Regenerate backup codes
  const regenerateBackupCodes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/two-factor-auth/backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate backup codes');
      }
      
      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setSuccess('Backup codes regenerated successfully');
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      setError(error instanceof Error ? error.message : 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };
  
  // Copy backup codes to clipboard
  const copyBackupCodes = () => {
    const codesText = backupCodes
      .filter(code => !code.used)
      .map(code => code.code)
      .join('\n');
    
    navigator.clipboard.writeText(codesText);
    setSuccess('Backup codes copied to clipboard');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };
  
  // Copy secret key to clipboard
  const copySecretKey = () => {
    if (secretKey) {
      navigator.clipboard.writeText(secretKey);
      setSuccess('Secret key copied to clipboard');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setStep('initial');
    setToken('');
    setError(null);
    setSuccess(null);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by enabling two-factor authentication.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default" className="mb-4 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {is2FAEnabled ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Two-factor authentication is enabled</AlertTitle>
              <AlertDescription>
                Your account is protected with an additional layer of security.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Disable two-factor authentication</h3>
              <p className="text-sm text-muted-foreground">
                Enter a verification code from your authenticator app to disable 2FA.
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                  className="w-40"
                />
                <Button 
                  variant="destructive" 
                  onClick={disable2FA}
                  disabled={loading || token.length !== 6}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Disable 2FA
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Backup codes</h3>
              <p className="text-sm text-muted-foreground">
                Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div 
                    key={index} 
                    className={`p-2 border rounded text-center ${code.used ? 'bg-gray-100 text-gray-400 line-through' : ''}`}
                  >
                    {code.code}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={copyBackupCodes}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy codes
                </Button>
                <Button variant="outline" size="sm" onClick={regenerateBackupCodes}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate new codes
                </Button>
              </div>
            </div>
          </div>
        ) : step === 'initial' ? (
          <div className="space-y-4">
            <p className="text-sm">
              Two-factor authentication adds an extra layer of security to your account. In addition to your password, you'll need to enter a code from your authenticator app when signing in.
            </p>
            <Button onClick={startSetup} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Set up two-factor authentication
            </Button>
          </div>
        ) : step === 'setup' ? (
          <div className="space-y-4">
            <Tabs defaultValue="qr">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr">QR Code</TabsTrigger>
                <TabsTrigger value="manual">Manual Setup</TabsTrigger>
              </TabsList>
              <TabsContent value="qr" className="space-y-4">
                <div className="flex justify-center py-4">
                  {qrCodeUrl ? (
                    <Image 
                      src={qrCodeUrl} 
                      alt="QR Code for 2FA" 
                      width={200} 
                      height={200} 
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-center">
                  Scan this QR code with your authenticator app.
                </p>
              </TabsContent>
              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm">
                    If you can't scan the QR code, enter this code manually in your authenticator app:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 p-2 rounded text-sm flex-1 overflow-x-auto">
                      {secretKey}
                    </code>
                    <Button variant="outline" size="icon" onClick={copySecretKey}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="space-y-2 pt-4">
              <h3 className="text-sm font-medium">Verify setup</h3>
              <p className="text-sm text-muted-foreground">
                Enter the verification code from your authenticator app to complete setup.
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                  className="w-40"
                />
                <Button 
                  onClick={verifyToken}
                  disabled={loading || token.length !== 6}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify
                </Button>
              </div>
            </div>
          </div>
        ) : step === 'complete' ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Setup complete</AlertTitle>
              <AlertDescription>
                Two-factor authentication has been enabled for your account.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Backup codes</h3>
              <p className="text-sm text-muted-foreground">
                Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div key={index} className="p-2 border rounded text-center">
                    {code.code}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={copyBackupCodes} className="mt-2">
                <Copy className="h-4 w-4 mr-2" />
                Copy codes
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {step !== 'initial' && !is2FAEnabled && (
          <Button variant="ghost" onClick={resetForm}>
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
