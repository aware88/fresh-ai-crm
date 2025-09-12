'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getIndividualPlans, getOrganizationPlans, formatPrice } from '@/lib/subscription-plans-v2';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import Link from 'next/link';
import { 
  BoxReveal,
  Label,
  Input
} from '@/components/ui/modern-animated-sign-in';

// Helper function to generate a URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function SignUpForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Organization-related state
  const [isOrganization, setIsOrganization] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Real-time password validation
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  
  // Resend confirmation state
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  // New states for password visibility and validation
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  // Get available plans based on organization selection
  const availablePlans = isOrganization ? getOrganizationPlans() : getIndividualPlans();

  // Set default plan when organization selection changes
  useEffect(() => {
    if (isOrganization) {
      // For organizations, we need to show that Premium plans are invitation-only
      // Set no default plan so user must make a conscious choice
      setSubscriptionPlan('');
    } else {
      setSubscriptionPlan('pro'); // Default to Pro for individuals (most popular)
    }
  }, [isOrganization]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    name: keyof typeof formData
  ) => {
    const value = event.target.value;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Password validation - only show errors after first submit attempt
  useEffect(() => {
    if (hasSubmitted && formData.password && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        setPasswordsMatch(false);
      } else {
        setPasswordError(null);
        setPasswordsMatch(true);
      }
    } else if (hasSubmitted && (!formData.password || !formData.confirmPassword)) {
      setPasswordError(null);
      setPasswordsMatch(false);
    } else if (!hasSubmitted) {
      // Before first submit, only check if passwords match for internal state
      setPasswordsMatch(formData.password === formData.confirmPassword && formData.password !== '');
      setPasswordError(null);
    }
  }, [formData.password, formData.confirmPassword, hasSubmitted]);

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
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
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

    // Prevent Premium plan self-signup - these require invitations
    if (isOrganization && subscriptionPlan.includes('premium')) {
      setError('Premium plans require an invitation from an administrator. Please contact us for Premium access.');
      return false;
    }

    return true;
  };

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setResendLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Confirmation email sent! Please check your inbox and spam folder.');
        setShowResendConfirmation(false);
        toast({
          title: "Confirmation Email Sent",
          description: "Please check your email inbox and spam folder for the confirmation link.",
        });
      } else {
        setError(data.error || 'Failed to send confirmation email');
      }
    } catch (error) {
      console.error('Resend confirmation error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setShowResendConfirmation(false);
    setHasSubmitted(true); // Enable password validation

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare the signup data
      const signupData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
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
        setSuccess('Registration successful! Please check your email inbox (and spam folder) for a confirmation link. You must click the link before you can sign in.');
        setShowSuccessModal(true);
        
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
        });
        setOrgName('');
        setOrgSlug('');
        setSubscriptionPlan('');
        setIsOrganization(false);
        setHasSubmitted(false); // Reset submit state
      } else {
        setError(data.error || 'Failed to create account');
        
        // Show resend confirmation option if available
        if (data.resendAvailable) {
          setShowResendConfirmation(true);
        }
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
    <div className="w-full">
      {/* Header */}
      <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">ARIS</h1>
          </Link>
          <p className="mt-2 text-gray-600">Create your account to get started</p>
        </div>
      </BoxReveal>

      {/* Error Messages */}
      {error && (
        <BoxReveal boxColor='var(--skeleton)' duration={0.3} className="mb-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {showResendConfirmation && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs text-red-600 mb-2">
                    Didn't receive the confirmation email?
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal underline justify-start text-xs"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                  >
                    {resendLoading ? 'Sending...' : 'Resend Confirmation Email'}
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </BoxReveal>
      )}
      
      {success && (
        <BoxReveal boxColor='var(--skeleton)' duration={0.3} className="mb-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        </BoxReveal>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-2 gap-4">
          <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange(e, 'firstName')}
                placeholder="John"
                required
              />
            </div>
          </BoxReveal>
          <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange(e, 'lastName')}
                placeholder="Doe"
                required
              />
            </div>
          </BoxReveal>
        </div>

        <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange(e, 'email')}
              placeholder="john@example.com"
              required
            />
          </div>
        </BoxReveal>

        <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange(e, 'password')}
                className="pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </BoxReveal>

        <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange(e, 'confirmPassword')}
                className={`pr-12 ${
                  passwordError ? 'border-red-300' : ''
                }`}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {passwordError && hasSubmitted && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
          </div>
        </BoxReveal>

        {/* Organization Checkbox */}
        <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
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
        </BoxReveal>

        {/* Organization Name (only shown if organization is selected) */}
        {isOrganization && (
          <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
            <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-medium text-blue-900">Organization Details</h3>
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={handleOrgNameChange}
                  placeholder="Acme Corporation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Organization URL</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">yourapp.com/</span>
                  <Input
                    id="orgSlug"
                    type="text"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    placeholder="acme-corp"
                    required
                  />
                </div>
              </div>
            </div>
          </BoxReveal>
        )}

        {/* Subscription Plan Selection */}
        <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">
              {isOrganization ? 'Organization Plan' : 'Choose Your Plan'}
            </Label>
              
              {availablePlans.map((plan) => {
                const isPremiumPlan = plan.isOrganizationPlan && plan.id.includes('premium');
                const isRestricted = isPremiumPlan; // For now, all Premium plans are invitation-only
                
                return (
                  <div
                    key={plan.id}
                    className={`relative p-4 border-2 rounded-xl transition-all ${
                      isRestricted 
                        ? 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed' 
                        : subscriptionPlan === plan.id
                          ? 'border-purple-500 bg-purple-50 cursor-pointer'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                    onClick={() => !isRestricted && setSubscriptionPlan(plan.id)}
                  >
                    {isRestricted && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                          Invitation Only
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isRestricted
                            ? 'border-gray-300 bg-gray-200'
                            : subscriptionPlan === plan.id
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-gray-300'
                        }`}>
                          {subscriptionPlan === plan.id && !isRestricted && (
                            <div className="w-full h-full bg-white rounded-full transform scale-50" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-semibold ${isRestricted ? 'text-gray-500' : 'text-gray-900'}`}>
                            {plan.name}
                          </h3>
                          {plan.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {plan.badge}
                            </Badge>
                          )}
                          {plan.popular && !isRestricted && (
                            <Badge className="text-xs bg-purple-100 text-purple-800">
                              Most Popular
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${isRestricted ? 'text-gray-500' : 'text-gray-600'}`}>
                          {isRestricted 
                            ? 'Premium plans require an invitation from an administrator'
                            : plan.description
                          }
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`text-2xl font-bold ${isRestricted ? 'text-gray-500' : 'text-gray-900'}`}>
                            {formatPrice(plan.monthlyPrice)}
                          </span>
                          <span className={`text-sm ${isRestricted ? 'text-gray-400' : 'text-gray-500'}`}>
                            /month
                          </span>
                          {plan.highlight && !isRestricted && (
                            <span className="text-sm text-purple-600 font-medium">
                              • {plan.highlight}
                            </span>
                          )}
                        </div>
                        {isRestricted && (
                          <div className="mt-2 text-xs text-blue-600">
                            <Link href="/contact" className="underline hover:text-blue-800">
                              Contact us for Premium access
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </BoxReveal>

        <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-6 text-base font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200" 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </BoxReveal>
      </form>

      {/* Additional Links */}
      <div className="mt-6 text-center">
        <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/signin" 
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </BoxReveal>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center">Registration Successful!</DialogTitle>
            <DialogDescription className="text-center">
              Your account has been created successfully! Please check your email inbox (and spam folder) for a confirmation link. You must click the confirmation link before you can sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button onClick={handleCloseSuccessModal} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Go to Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
