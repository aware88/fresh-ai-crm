'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getIndividualPlans, getOrganizationPlans, formatPrice } from '@/lib/subscription-plans';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

// Helper function to generate a URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Organization-related state
  const [isOrganization, setIsOrganization] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Real-time password validation
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  // Get available plans based on organization selection
  const availablePlans = isOrganization ? getOrganizationPlans() : getIndividualPlans();

  // Set default plan when organization selection changes
  useEffect(() => {
    if (isOrganization) {
      setSubscriptionPlan('premium'); // Only Premium for organizations
    } else {
      setSubscriptionPlan('pro'); // Default to Pro for individuals (most popular)
    }
  }, [isOrganization]);

  useEffect(() => {
    if (password && confirmPassword) {
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        setPasswordsMatch(false);
      } else {
        setPasswordError(null);
        setPasswordsMatch(true);
      }
    } else {
      setPasswordError(null);
      setPasswordsMatch(false);
    }
  }, [password, confirmPassword]);

  // Handle organization name change - auto-generate slug
  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setOrgName(name);
    
    // Auto-generate slug from organization name if user hasn't manually edited it
    if (!orgSlug || orgSlug === generateSlug(orgName)) {
      setOrgSlug(generateSlug(name));
    }
  };

  // Validate form
  const validateForm = () => {
    if (!email || !password || !firstName || !lastName) {
      setError('Please fill in all required fields');
      return false;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return false;
    }

    if (isOrganization && !orgName) {
      setError('Organization name is required for organization accounts');
      return false;
    }

    if (!subscriptionPlan) {
      setError('Please select a subscription plan');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare the signup data
      const signupData = {
        email,
        password,
        firstName,
        lastName,
        subscriptionPlan,
        isOrganization,
        ...(isOrganization && {
          orgName,
          orgSlug: orgSlug || generateSlug(orgName),
        }),
      };

      // Call the signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Account created successfully! Please check your email to verify your account.');
        setShowSuccessModal(true);
        
        // Reset form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setOrgName('');
        setOrgSlug('');
        setSubscriptionPlan('');
        setIsOrganization(false);
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Join thousands of users growing their business
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                placeholder="john@example.com"
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
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 ${
                  passwordError ? 'border-red-300' : ''
                }`}
                placeholder="Confirm your password"
                required
              />
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
            </div>

            {/* Organization Checkbox */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-xl">
              <Checkbox
                id="isOrganization"
                checked={isOrganization}
                onCheckedChange={(checked) => setIsOrganization(checked as boolean)}
              />
              <Label htmlFor="isOrganization" className="text-sm font-medium text-gray-700">
                This is for an organization
              </Label>
            </div>

            {/* Organization Name (only shown if organization is selected) */}
            {isOrganization && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-medium text-blue-900">Organization Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-gray-700 font-medium">Organization Name</Label>
                  <Input
                    id="orgName"
                    type="text"
                    value={orgName}
                    onChange={handleOrgNameChange}
                    className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                    placeholder="Acme Corporation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgSlug" className="text-gray-700 font-medium">Organization URL</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">yourapp.com/</span>
                    <Input
                      id="orgSlug"
                      type="text"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                      placeholder="acme-corp"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Plan Selection */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">
                {isOrganization ? 'Organization Plan' : 'Choose Your Plan'}
              </Label>
              
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    subscriptionPlan === plan.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSubscriptionPlan(plan.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        subscriptionPlan === plan.id
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-300'
                      }`}>
                        {subscriptionPlan === plan.id && (
                          <div className="w-full h-full bg-white rounded-full transform scale-50" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        {plan.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {plan.badge}
                          </Badge>
                        )}
                        {plan.popular && (
                          <Badge className="text-xs bg-purple-100 text-purple-800">
                            Most Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(plan.monthlyPrice)}
                        </span>
                        <span className="text-sm text-gray-500">/month</span>
                        {plan.highlight && (
                          <span className="text-sm text-purple-600 font-medium">
                            • {plan.highlight}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-6 text-base font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Account Created Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              Welcome to ARIS! Your account has been created successfully. You can now sign in and start using the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button onClick={handleCloseSuccessModal} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Continue to Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
