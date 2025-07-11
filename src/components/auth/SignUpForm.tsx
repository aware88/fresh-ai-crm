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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="p-8 pb-4">
        <h3 className="text-2xl font-bold text-gray-900">Sign Up</h3>
        <p className="text-gray-600 text-base mt-1">Create your account to get started</p>
      </div>
      <div className="p-8 pt-4">
        {error && (
          <Alert variant="destructive" className="mb-6 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="default" className="mb-6 bg-green-50 text-green-800 border-green-200 rounded-xl">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="individual" className="w-full" onValueChange={setSignupTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl p-1 bg-gray-100">
            <TabsTrigger value="individual" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:font-medium py-3">Individual</TabsTrigger>
            <TabsTrigger value="organization" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:font-medium py-3">Organization</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* User Information - Common to both tabs */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                required
              />
            </div>
            
            {/* Organization Information - Only shown in organization tab */}
            <TabsContent value="organization" className="mt-4 space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="isAdmin" 
                  checked={isAdmin} 
                  onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
                  className="border-gray-300 text-purple-600 focus:ring-purple-500/30"
                />
                <Label htmlFor="isAdmin" className="text-gray-700 font-medium">I am creating an organization</Label>
              </div>
              
              {isAdmin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="orgName" className="text-gray-700 font-medium">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={handleOrgNameChange}
                      placeholder="Acme Inc."
                      className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                      required={isAdmin}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orgSlug" className="text-gray-700 font-medium">Organization Slug</Label>
                    <Input
                      id="orgSlug"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      placeholder="acme-inc"
                      className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                      required={isAdmin}
                      pattern="[a-z0-9-]+"
                      title="Only lowercase letters, numbers, and hyphens are allowed"
                    />
                    <p className="text-xs text-gray-500">
                      This will be used in your organization's URL: aris.com/{orgSlug || 'your-org'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionPlan" className="text-gray-700 font-medium">Subscription Plan</Label>
                    <Select 
                      value={subscriptionPlan} 
                      onValueChange={setSubscriptionPlan}
                    >
                      <SelectTrigger className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-200">
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="pro">Professional</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      You can change your plan later in the organization settings.
                    </p>
                  </div>
                </>
              )}
            </TabsContent>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-6 text-base font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : signupTab === 'organization' ? 'Create Organization' : 'Sign Up'}
            </Button>
          </form>
        </Tabs>
      </div>
      <div className="p-8 pt-2">
        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/signin" className="text-blue-600 hover:text-purple-600 font-medium hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
