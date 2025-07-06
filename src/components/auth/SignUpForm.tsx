'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Organization-related state
  const [signupTab, setSignupTab] = useState('individual');
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('free');

  // Handle organization name change - auto-generate slug
  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setOrgName(name);
    
    // Auto-generate slug from organization name if user hasn't manually edited it
    if (!orgSlug || orgSlug === generateSlug(orgName)) {
      setOrgSlug(generateSlug(name));
    }
  };
  
  // Generate a URL-friendly slug from a string
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, '') // Remove non-word chars except hyphens
      .replace(/\-\-+/g, '-')    // Replace multiple hyphens with single hyphen
      .replace(/^-+/, '')        // Trim hyphens from start
      .replace(/-+$/, '');       // Trim hyphens from end
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Step 1: Create the user account
      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            is_organization_admin: isAdmin && signupTab === 'organization',
            full_name: `${firstName} ${lastName}`.trim()
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }
      
      // Step 2: If creating an organization, set it up
      if (isAdmin && signupTab === 'organization' && userData.user) {
        try {
          // Create organization via API
          const response = await fetch('/api/admin/organizations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: orgName,
              slug: orgSlug,
              admin_user_id: userData.user.id,
              subscription_plan: subscriptionPlan
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Organization creation failed:', errorData);
            // Continue with signup even if org creation fails
            // We'll just show a warning to the user
            setError(`Account created, but organization setup failed: ${errorData.error || 'Unknown error'}. You can set up your organization later.`);
            setSuccess('Check your email for the confirmation link.');
            return;
          }
          
          const orgData = await response.json();
          console.log('Organization created successfully:', orgData);
        } catch (orgError) {
          console.error('Error during organization creation:', orgError);
          // Continue with signup even if org creation fails
          setError(`Account created, but organization setup failed. You can set up your organization later.`);
          setSuccess('Check your email for the confirmation link.');
          return;
        }
      }

      setSuccess('Check your email for the confirmation link.');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>
          Join Fresh AI CRM to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        
        <Tabs value={signupTab} onValueChange={setSignupTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Individual</TabsTrigger>
            <TabsTrigger value="organization">Organization Admin</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* User Information - Common to both tabs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {/* Organization Information - Only shown in organization tab */}
            <TabsContent value="organization" className="mt-4 space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox 
                  id="isAdmin" 
                  checked={isAdmin} 
                  onCheckedChange={(checked) => setIsAdmin(checked as boolean)} 
                />
                <Label htmlFor="isAdmin">I am creating an organization</Label>
              </div>
              
              {isAdmin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={handleOrgNameChange}
                      placeholder="Acme Inc."
                      required={isAdmin}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orgSlug">Organization Slug</Label>
                    <Input
                      id="orgSlug"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      placeholder="acme-inc"
                      required={isAdmin}
                      pattern="[a-z0-9-]+"
                      title="Only lowercase letters, numbers, and hyphens are allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be used in your organization's URL: fresh-ai-crm.com/{orgSlug || 'your-org'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                    <Select 
                      value={subscriptionPlan} 
                      onValueChange={setSubscriptionPlan}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="pro">Professional</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      You can change your plan later in the organization settings.
                    </p>
                  </div>
                </>
              )}
            </TabsContent>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-medium" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : signupTab === 'organization' ? 'Create Organization' : 'Sign Up'}
            </Button>
          </form>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
