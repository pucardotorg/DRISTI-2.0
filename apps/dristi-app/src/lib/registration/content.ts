import type { Locale } from "@/lib/onboarding/content";

type Copy = Record<Locale, string>;
const t = (en: string, ml: string): Copy => ({ en, ml });

export const registrationUi = {
  backToSignIn: t("Back to sign in", "സൈൻ ഇൻ പേജിലേക്ക് മടങ്ങുക"),
  back: t("Back", "പുറകോട്ട്"),
  continue: t("Continue", "തുടരുക"),
  stepOf: t("Step {current} of {total}", "{total} ഘട്ടങ്ങളിൽ {current}-ാം ഘട്ടം"),
} as const;

export const journeySteps = {
  role: { title: t("Role", "പങ്ക്"), description: t("How you use the portal", "പോർട്ടൽ എങ്ങനെ ഉപയോഗിക്കുന്നു") },
  name: { title: t("Name", "പേര്"), description: t("Your name", "നിങ്ങളുടെ പേര്") },
  contact: { title: t("Contact", "ബന്ധപ്പെടുക"), description: t("Mobile and email", "മൊബൈലും ഇമെയിലും") },
  verification: { title: t("Verification", "പരിശോധന"), description: t("Your registration details", "നിങ്ങളുടെ രജിസ്ട്രേഷൻ വിവരങ്ങൾ") },
  terms: { title: t("Terms", "നിബന്ധനകൾ"), description: t("Read and accept", "വായിച്ച് അംഗീകരിക്കുക") },
} as const;

export const roleStep = {
  title: t("How will you use this account?", "ഈ അക്കൗണ്ട് എങ്ങനെ ഉപയോഗിക്കും?"),
  body: t("Choose the option that best describes you.", "നിങ്ങളെ ഏറ്റവും നന്നായി വിവരിക്കുന്ന ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക."),
  litigant: t("Litigant", "കക്ഷി"),
  litigantHint: t("A case is about you, or you want to file a case.", "ഒരു കേസ് നിങ്ങളെക്കുറിച്ചാണ്, അല്ലെങ്കിൽ നിങ്ങൾക്ക് കേസ് ഫയൽ ചെയ്യണം."),
  advocate: t("Advocate", "അഭിഭാഷകൻ"),
  advocateHint: t("You are enrolled with a State Bar Council.", "നിങ്ങൾ ഒരു സംസ്ഥാന ബാർ കൗൺസിലിൽ എൻറോൾ ചെയ്തിട്ടുണ്ട്."),
  advocateClerk: t("Advocate clerk", "അഭിഭാഷക ക്ലർക്ക്"),
  advocateClerkHint: t("You assist an advocate with cases and paperwork.", "കേസുകളിലും രേഖകളിലും നിങ്ങൾ ഒരു അഭിഭാഷകനെ സഹായിക്കുന്നു."),
  poa: t("Power of attorney holder", "പവർ ഓഫ് അറ്റോർണി ഉടമ"),
  poaHint: t("You are authorised to act for a litigant.", "ഒരു കക്ഷിക്ക് വേണ്ടി പ്രവർത്തിക്കാൻ നിങ്ങൾക്ക് അധികാരമുണ്ട്."),
  required: t("Choose how you will use this account.", "ഈ അക്കൗണ്ട് എങ്ങനെ ഉപയോഗിക്കുമെന്ന് തിരഞ്ഞെടുക്കുക."),
} as const;

export const nameStep = {
  title: t("Your name", "നിങ്ങളുടെ പേര്"),
  body: t("Enter your first name to continue. Middle and last names are optional.", "തുടരാൻ നിങ്ങളുടെ പേര് നൽകുക. മധ്യനാമവും അവസാന നാമവും നിർബന്ധമല്ല."),
  firstName: t("First name", "പേര്"),
  middleName: t("Middle name (optional)", "മധ്യനാമം (നിർബന്ധമല്ല)"),
  lastName: t("Last name (optional)", "അവസാന നാമം (നിർബന്ധമല്ല)"),
  error: t("Enter your first name.", "നിങ്ങളുടെ പേര് നൽകുക."),
} as const;

export const contactStep = {
  title: t("Your contact details", "നിങ്ങളുടെ ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ"),
  body: t("Use your mobile number to register. Email is optional.", "രജിസ്റ്റർ ചെയ്യാൻ നിങ്ങളുടെ മൊബൈൽ നമ്പർ ഉപയോഗിക്കുക. ഇമെയിൽ നിർബന്ധമല്ല."),
  mobile: t("Mobile number", "മൊബൈൽ നമ്പർ"),
  mobilePlaceholder: t("10-digit mobile number", "10 അക്ക മൊബൈൽ നമ്പർ"),
  mobileError: t("Enter the 10 digits of your mobile number.", "മൊബൈൽ നമ്പറിന്റെ 10 അക്കങ്ങൾ നൽകുക."),
  mobileHint: t("We use this number for sign-in and court updates.", "സൈൻ ഇൻ ചെയ്യാനും കോടതി അറിയിപ്പുകൾക്കും ഈ നമ്പർ ഉപയോഗിക്കും."),
  email: t("Email address (optional)", "ഇമെയിൽ വിലാസം (നിർബന്ധമല്ല)"),
  emailPlaceholder: t("name@example.com", "name@example.com"),
  emailError: t("Enter a valid email address.", "ശരിയായ ഇമെയിൽ വിലാസം നൽകുക."),
  sendOtp: t("Send one-time code", "ഒറ്റത്തവണ കോഡ് അയയ്ക്കുക"),
  otpSent: t("We sent a 6-digit code to +91 {number}.", "+91 {number} എന്ന നമ്പറിലേക്ക് 6 അക്ക കോഡ് അയച്ചു."),
  otpLabel: t("6-digit code", "6 അക്ക കോഡ്"),
  otpError: t("Enter all 6 digits.", "6 അക്കങ്ങളും നൽകുക."),
  otpVerify: t("Verify", "പരിശോധിക്കുക"),
  otpResend: t("Send the code again", "കോഡ് വീണ്ടും അയയ്ക്കുക"),
  otpResendIn: t("You can ask for a new code in {seconds} seconds.", "{seconds} സെക്കൻഡിനുള്ളിൽ പുതിയ കോഡ് ചോദിക്കാം."),
  verified: t("Mobile number verified", "മൊബൈൽ നമ്പർ പരിശോധിച്ചു"),
  changeNumber: t("Change number", "നമ്പർ മാറ്റുക"),
  verifyFirst: t("Verify your mobile number to continue.", "തുടരാൻ നിങ്ങളുടെ മൊബൈൽ നമ്പർ പരിശോധിക്കുക."),
} as const;

/**
 * One step, two roles. The advocate and clerk verifications are the same screen with
 * different words — same as the legacy product, where one component served both.
 */
export const verificationSteps = {
  advocate: {
    title: t("Advocate verification", "അഭിഭാഷക പരിശോധന"),
    body: t("To ensure the authenticity of your profile, share these details for the court to verify.", "നിങ്ങളുടെ പ്രൊഫൈലിന്റെ ആധികാരികത ഉറപ്പാക്കാൻ, കോടതിക്ക് പരിശോധിക്കാനായി ഈ വിവരങ്ങൾ നൽകുക."),
    numberLabel: t("Bar registration number", "ബാർ രജിസ്ട്രേഷൻ നമ്പർ"),
    numberPlaceholder: t("For example K/1234/2020", "ഉദാഹരണം K/1234/2020"),
    numberError: t("Enter your Bar registration number.", "നിങ്ങളുടെ ബാർ രജിസ്ട്രേഷൻ നമ്പർ നൽകുക."),
    uploadLabel: t("Bar Council ID", "ബാർ കൗൺസിൽ ID"),
    uploadHint: t("Ensure the registration number is clearly visible.", "രജിസ്ട്രേഷൻ നമ്പർ വ്യക്തമായി കാണാമെന്ന് ഉറപ്പാക്കുക."),
    uploadError: t("Upload your Bar Council ID.", "നിങ്ങളുടെ ബാർ കൗൺസിൽ ID അപ്‌ലോഡ് ചെയ്യുക."),
  },
  advocateClerk: {
    title: t("Advocate clerk verification", "അഭിഭാഷക ക്ലർക്ക് പരിശോധന"),
    body: t("To ensure the authenticity of your profile, share these details for the court to verify.", "നിങ്ങളുടെ പ്രൊഫൈലിന്റെ ആധികാരികത ഉറപ്പാക്കാൻ, കോടതിക്ക് പരിശോധിക്കാനായി ഈ വിവരങ്ങൾ നൽകുക."),
    numberLabel: t("Clerk registration number", "ക്ലർക്ക് രജിസ്ട്രേഷൻ നമ്പർ"),
    numberPlaceholder: t("Your clerk registration number", "നിങ്ങളുടെ ക്ലർക്ക് രജിസ്ട്രേഷൻ നമ്പർ"),
    numberError: t("Enter your clerk registration number.", "നിങ്ങളുടെ ക്ലർക്ക് രജിസ്ട്രേഷൻ നമ്പർ നൽകുക."),
    uploadLabel: t("Clerk ID", "ക്ലർക്ക് ID"),
    uploadHint: t("Ensure the registration number is clearly visible.", "രജിസ്ട്രേഷൻ നമ്പർ വ്യക്തമായി കാണാമെന്ന് ഉറപ്പാക്കുക."),
    uploadError: t("Upload your clerk ID.", "നിങ്ങളുടെ ക്ലർക്ക് ID അപ്‌ലോഡ് ചെയ്യുക."),
  },
} as const;

export const verificationUi = {
  fileHelp: t("JPG, JPEG, PNG or PDF · up to 10 MB", "JPG, JPEG, PNG അല്ലെങ്കിൽ PDF · പരമാവധി 10 MB"),
  noFile: t("No file chosen yet", "ഫയൽ ഇതുവരെ തിരഞ്ഞെടുത്തിട്ടില്ല"),
  chooseFile: t("Choose file", "ഫയൽ തിരഞ്ഞെടുക്കുക"),
  changeFile: t("Change file", "ഫയൽ മാറ്റുക"),
} as const;

export const termsStep = {
  title: t("Terms and Conditions", "നിബന്ധനകളും വ്യവസ്ഥകളും"),
  body: t("Read and agree to these terms before creating your account.", "അക്കൗണ്ട് ഉണ്ടാക്കുന്നതിന് മുമ്പ് ഈ നിബന്ധനകൾ വായിച്ച് അംഗീകരിക്കുക."),
  clauses: [
    t("By using this app, you agree to abide by our community guidelines, fostering a respectful and inclusive environment for all users.", "ഈ ആപ്പ് ഉപയോഗിക്കുന്നതിലൂടെ, എല്ലാ ഉപയോക്താക്കൾക്കും മാന്യവും ഉൾക്കൊള്ളുന്നതുമായ അന്തരീക്ഷം ഉറപ്പാക്കുന്ന സമൂഹ മാർഗ്ഗനിർദ്ദേശങ്ങൾ പാലിക്കാൻ നിങ്ങൾ സമ്മതിക്കുന്നു."),
    t("Your privacy is paramount. Rest assured, your data is securely handled and never shared with third parties without your consent.", "നിങ്ങളുടെ സ്വകാര്യത പ്രധാനമാണ്. നിങ്ങളുടെ വിവരങ്ങൾ സുരക്ഷിതമായി കൈകാര്യം ചെയ്യുകയും നിങ്ങളുടെ സമ്മതമില്ലാതെ മൂന്നാം കക്ഷികളുമായി പങ്കിടാതിരിക്കുകയും ചെയ്യും."),
    t("Please refrain from engaging in any unlawful activities while using our app, ensuring a safe and compliant platform for everyone.", "എല്ലാവർക്കും സുരക്ഷിതവും നിയമാനുസൃതവുമായ വേദി ഉറപ്പാക്കാൻ ഈ ആപ്പ് ഉപയോഗിക്കുമ്പോൾ നിയമവിരുദ്ധ പ്രവർത്തനങ്ങളിൽ ഏർപ്പെടരുത്."),
    t("We reserve the right to modify our services and terms at any time, keeping you informed of any updates through our communication channels.", "ഞങ്ങളുടെ സേവനങ്ങളും നിബന്ധനകളും എപ്പോൾ വേണമെങ്കിലും മാറ്റാനുള്ള അവകാശം ഞങ്ങൾക്കുണ്ട്. മാറ്റങ്ങൾ ഞങ്ങളുടെ ആശയവിനിമയ മാർഗ്ഗങ്ങളിലൂടെ നിങ്ങളെ അറിയിക്കും."),
    t("By proceeding, I consent to the electronic processing of transactions on this website. I authorize the collection and use of my personal information, including Aadhaar details (if applicable), for the purpose of generating electronic signatures. I further consent to the sharing of my personal information with authorized third-party e-signature service providers to facilitate this process. I understand that I may withdraw my consent at any time, and that electronically signed documents will be retained as electronic records for future reference.", "തുടരുന്നതിലൂടെ, ഈ വെബ്‌സൈറ്റിലെ ഇടപാടുകളുടെ ഇലക്ട്രോണിക് പ്രോസസ്സിംഗിന് ഞാൻ സമ്മതിക്കുന്നു. ഇലക്ട്രോണിക് ഒപ്പുകൾ സൃഷ്ടിക്കുന്നതിനായി ആധാർ വിവരങ്ങൾ (ബാധകമെങ്കിൽ) ഉൾപ്പെടെയുള്ള എന്റെ വ്യക്തിഗത വിവരങ്ങൾ ശേഖരിക്കാനും ഉപയോഗിക്കാനും ഞാൻ അനുമതി നൽകുന്നു. ഈ പ്രക്രിയയ്ക്കായി അംഗീകൃത മൂന്നാം കക്ഷി ഇ-സിഗ്നേച്ചർ സേവനദാതാക്കളുമായി എന്റെ വിവരങ്ങൾ പങ്കിടുന്നതിനും ഞാൻ സമ്മതിക്കുന്നു. എപ്പോൾ വേണമെങ്കിലും സമ്മതം പിൻവലിക്കാമെന്നും ഇലക്ട്രോണിക് ഒപ്പിട്ട രേഖകൾ ഭാവിയിലെ റഫറൻസിനായി സൂക്ഷിക്കുമെന്നും ഞാൻ മനസ്സിലാക്കുന്നു."),
  ],
  accept: t("I have read and accept the Terms and Conditions.", "നിബന്ധനകളും വ്യവസ്ഥകളും ഞാൻ വായിച്ച് അംഗീകരിക്കുന്നു."),
  error: t("Accept the terms to create your account.", "അക്കൗണ്ട് ഉണ്ടാക്കാൻ നിബന്ധനകൾ അംഗീകരിക്കുക."),
  submit: t("Accept and create account", "അംഗീകരിച്ച് അക്കൗണ്ട് ഉണ്ടാക്കുക"),
} as const;

export const successStep = {
  title: t("Your account is ready", "നിങ്ങളുടെ അക്കൗണ്ട് തയ്യാറായി"),
  body: t("You can add your address and official ID from your profile after entering the portal.", "പോർട്ടലിൽ പ്രവേശിച്ച ശേഷം പ്രൊഫൈലിൽ നിന്ന് വിലാസവും ഔദ്യോഗിക IDയും ചേർക്കാം."),
  summonedAction: t("Continue to your case", "നിങ്ങളുടെ കേസിലേക്ക് തുടരുക"),
  generalAction: t("Go to your home page", "ഹോം പേജിലേക്ക് പോകുക"),
} as const;

/** Advocates and clerks do not get access on submission — the court approves first. */
export const approvalStep = {
  title: t("Your registration is awaiting approval", "നിങ്ങളുടെ രജിസ്ട്രേഷൻ അംഗീകാരം കാത്തിരിക്കുന്നു"),
  /** `{id}` is the application number, shown so it can be quoted at the court. */
  body: t("Your registration (ID: {id}) is in progress. You will get an SMS when it is done.", "നിങ്ങളുടെ രജിസ്ട്രേഷൻ (ID: {id}) നടന്നുകൊണ്ടിരിക്കുന്നു. പൂർത്തിയാകുമ്പോൾ SMS ലഭിക്കും."),
  action: t("View my application", "എന്റെ അപേക്ഷ കാണുക"),
} as const;

export const applicationView = {
  title: t("Application number {id}", "അപേക്ഷാ നമ്പർ {id}"),
  name: t("Name", "പേര്"),
  mobile: t("Mobile number", "മൊബൈൽ നമ്പർ"),
  email: t("Email address", "ഇമെയിൽ വിലാസം"),
  role: t("Registering as", "രജിസ്റ്റർ ചെയ്യുന്നത്"),
} as const;
