"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  UserPlus,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PasswordInput,
  PasswordCriteria,
} from "@/components/ui/password-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { AppRole, publicSignupRoleOptions } from "@/lib/auth/roles"
import {
  getAuthConfirmUrl,
  isStrongPassword,
  normalizeEmail,
  passwordRequirements,
} from "@/lib/auth/validation"
import { formatName, formatEmail, formatPhone } from "@/lib/formUtils"


const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Germany",
  "Singapore",
  "United Arab Emirates",
  "Other",
]

const COUNTRY_CODES: { label: string; value: string }[] = [
  { label: "🇮🇳 India +91", value: "+91" },
  { label: "🇺🇸 USA +1", value: "+1" },
  { label: "🇬🇧 UK +44", value: "+44" },
  { label: "🇨🇦 Canada +1", value: "+1" },
  { label: "🇦🇺 Australia +61", value: "+61" },
  { label: "🇩🇪 Germany +49", value: "+49" },
  { label: "🇫🇷 France +33", value: "+33" },
  { label: "🇯🇵 Japan +81", value: "+81" },
  { label: "🇨🇳 China +86", value: "+86" },
  { label: "🇦🇪 UAE +971", value: "+971" },
  { label: "🇧🇩 Bangladesh +880", value: "+880" },
  { label: "🇵🇰 Pakistan +92", value: "+92" },
  { label: "🇸🇬 Singapore +65", value: "+65" },
  { label: "🇲🇾 Malaysia +60", value: "+60" },
]

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-slate-950 px-2.5 text-sm text-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const nativeOptionStyle = {
  backgroundColor: "#0f172a",
  color: "#f8fafc",
}

export default function Page() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<AppRole>("procurement_officer")
  const [country, setCountry] = useState("India")
  const [countryCode, setCountryCode] = useState("+91")
  const [orgInfo, setOrgInfo] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const selectedRole = useMemo(
    () => publicSignupRoleOptions.find((option) => option.value === role),
    [role],
  )

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setPhotoFile(file)

    if (!file) {
      setPhotoPreview(null)
      return
    }

    if (!file.type.startsWith("image/")) {
      setError("Upload an image file for the profile photo.")
      event.target.value = ""
      setPhotoFile(null)
      setPhotoPreview(null)
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Profile photo must be smaller than 2MB.")
      event.target.value = ""
      setPhotoFile(null)
      setPhotoPreview(null)
      return
    }

    setError(null)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const uploadProfilePhoto = async (userId: string, file: File) => {
    const supabase = createClient()
    const extension = file.name.split(".").pop() || "jpg"
    const storagePath = `${userId}/avatar.${extension}`

    const { error: uploadError } = await supabase.storage
      .from("profile-avatars")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      setNotice(
        "Account created, but the profile photo could not be uploaded.",
      )
      return
    }

    await supabase.auth.updateUser({
      data: { avatar_url: storagePath },
    })

    await supabase
      .from("profiles")
      .update({ avatar_url: storagePath })
      .eq("id", userId)
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setNotice(null)

    const normalizedEmail = normalizeEmail(email)

    if (!firstName.trim() || !lastName.trim()) {
      setError("Enter first name and last name.")
      return
    }

    if (!normalizedEmail) {
      setError("Enter a valid email address.")
      return
    }

    const digitsOnly = phone.replace(/[^0-9]/g, "")
    if (!digitsOnly) {
      setError("Enter a phone number.")
      return
    } else if (digitsOnly.length !== 10) {
      setError("Phone number must be exactly 10 digits.")
      return
    }

    if (!isStrongPassword(password)) {
      setError(passwordRequirements)
      return
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: getAuthConfirmUrl("/dashboard"),
          data: {
            first_name: formatName(firstName),
            last_name: formatName(lastName),
            phone: `${countryCode}${digitsOnly}`,
            role,
            country,
            additional_info: orgInfo.trim() || undefined,
            phone_prefix: countryCode,
          },
        },
      })

      if (error) throw error

      if (photoFile && data.user && data.session) {
        await uploadProfilePhoto(data.user.id, photoFile)
      }

      router.push("/auth/sign-up-success")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create account.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background px-4 py-8">
      <Card className="mx-auto w-full max-w-3xl border-border/70">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-muted">
            <UserPlus className="size-6 text-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Register on VendorBridge</CardTitle>
            <CardDescription>
              Create your ERP profile with role-based procurement access.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <label
                htmlFor="photo"
                className="flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
              >
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <Camera className="size-7" />
                )}
              </label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <p className="text-xs text-muted-foreground">
                Optional profile photo, up to 2MB.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(formatName(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(formatName(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(formatEmail(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <div className="flex gap-2">
                  <Select
                    value={countryCode}
                    onValueChange={(val) => {
                      if (val) {
                        setCountryCode(val);
                      }
                    }}>
                    <SelectTrigger
                      id="country-code"
                      className="bg-slate-700 border-slate-600 text-white w-[110px] shrink-0">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem
                          key={c.value}
                          value={c.value}
                          className="text-white">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    required
                    className="flex-1"
                    placeholder="9876543210"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as AppRole)}
                  className={selectClassName}
                >
                  {publicSignupRoleOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      style={nativeOptionStyle}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                {selectedRole && (
                  <p className="text-xs text-muted-foreground">
                    {selectedRole.description}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={selectClassName}
                >
                  {COUNTRIES.map((countryOption) => (
                    <option
                      key={countryOption}
                      value={countryOption}
                      style={nativeOptionStyle}
                    >
                      {countryOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organization name</Label>
              <Input
                id="organization"
                value={orgInfo}
                onChange={(e) => setOrgInfo(e.target.value)}
                placeholder="Your company or procurement organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-info">Additional information</Label>
              <Textarea
                id="additional-info"
                value={additionalInfo}
                onChange={(event) => setAdditionalInfo(event.target.value)}
                placeholder="Department, vendor company, approval level, or other onboarding details"
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {password && <PasswordCriteria password={password} />}
                <p className="text-xs text-muted-foreground">
                  {passwordRequirements}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeat-password">Repeat password</Label>
                <PasswordInput
                  id="repeat-password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {notice && (
              <div className="flex gap-2 rounded-lg border border-green-600/30 bg-green-600/10 px-3 py-2 text-sm text-green-600">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {error && (
              <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {isLoading ? "Creating account..." : "Register"}
              </Button>
              <Link
                href="/auth/login"
                className={buttonVariants({
                  variant: "outline",
                  className: "flex-1",
                })}
              >
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
