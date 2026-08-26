export const PURPOSE_MAX_LENGTH = 1_000;
export const DOCUMENT_MAX_LENGTH = 250;

export type WitnessAddressType = "RESIDENTIAL" | "OFFICE" | "";

export type WitnessAddressDraft = {
  clientId: string;
  addressType: WitnessAddressType;
  pincode: string;
  state: string;
  district: string;
  cityOrTown: string;
  address: string;
};

export type WitnessDocumentDraft = {
  clientId: string;
  description: string;
};

/**
 * Local-only draft shape. There is deliberately no request type here: the
 * product does not yet expose a witness API or a stable participant id.
 */
export type WitnessDraft = {
  firstName: string;
  middleName: string;
  lastName: string;
  designation: string;
  age: string;
  purposeOfExamination: string;
  documentsToBeProduced: WitnessDocumentDraft[];
  mobileNumbers: string[];
  emailIds: string[];
  addresses: WitnessAddressDraft[];
};

export type WitnessDetailsErrors = {
  firstName?: string;
  designation?: string;
  age?: string;
  purposeOfExamination?: string;
  documents: Record<string, string>;
};

export type WitnessAddressErrors = Partial<
  Record<
    | "addressType"
    | "pincode"
    | "state"
    | "district"
    | "cityOrTown"
    | "address",
    string
  >
>;

export type WitnessContactErrors = {
  mobileInput?: string;
  emailInput?: string;
  addresses: Record<string, WitnessAddressErrors>;
};

export function createEmptyWitnessDraft(): WitnessDraft {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    designation: "",
    age: "",
    purposeOfExamination: "",
    documentsToBeProduced: [],
    mobileNumbers: [],
    emailIds: [],
    addresses: [],
  };
}

export function createEmptyWitnessAddress(
  clientId: string
): WitnessAddressDraft {
  return {
    clientId,
    addressType: "",
    pincode: "",
    state: "",
    district: "",
    cityOrTown: "",
    address: "",
  };
}

export function normalizeMobileNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits.slice(0, 10);
}

export function mobileDisplayValue(value: string): string {
  return `+91 ${value}`;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function addressHasAnyValue(address: WitnessAddressDraft): boolean {
  return Boolean(
    address.addressType ||
      address.pincode.trim() ||
      address.state.trim() ||
      address.district.trim() ||
      address.cityOrTown.trim() ||
      address.address.trim()
  );
}

export function witnessDraftIsDirty(
  draft: WitnessDraft,
  mobileInput: string,
  emailInput: string
): boolean {
  return Boolean(
    draft.firstName.trim() ||
      draft.middleName.trim() ||
      draft.lastName.trim() ||
      draft.designation.trim() ||
      draft.age.trim() ||
      draft.purposeOfExamination.trim() ||
      draft.documentsToBeProduced.length ||
      draft.mobileNumbers.length ||
      draft.emailIds.length ||
      draft.addresses.length ||
      mobileInput.trim() ||
      emailInput.trim()
  );
}

export function validateWitnessDetails(
  draft: WitnessDraft
): WitnessDetailsErrors {
  const errors: WitnessDetailsErrors = { documents: {} };
  const firstName = draft.firstName.trim();
  const designation = draft.designation.trim();

  if (!firstName && !designation) {
    errors.firstName = "Enter a first name or designation.";
  } else if (firstName && !/\p{L}/u.test(firstName)) {
    errors.firstName = "First name must include at least one letter.";
  }
  if (designation && !/\p{L}/u.test(designation)) {
    errors.designation = "Designation must include at least one letter.";
  }

  if (draft.age.trim()) {
    const age = draft.age.trim();
    if (!/^\d{1,3}$/.test(age) || Number(age) < 1) {
      errors.age = "Enter a positive whole number of up to 3 digits.";
    }
  }

  if (draft.purposeOfExamination.length > PURPOSE_MAX_LENGTH) {
    errors.purposeOfExamination = `Use ${PURPOSE_MAX_LENGTH.toLocaleString(
      "en-IN"
    )} characters or fewer.`;
  }

  for (const document of draft.documentsToBeProduced) {
    const description = document.description.trim();
    if (!description) {
      errors.documents[document.clientId] =
        "Enter a document description or remove this item.";
    } else if (description.length > DOCUMENT_MAX_LENGTH) {
      errors.documents[
        document.clientId
      ] = `Use ${DOCUMENT_MAX_LENGTH} characters or fewer.`;
    }
  }

  return errors;
}

export function witnessDetailsHaveErrors(
  errors: WitnessDetailsErrors
): boolean {
  return Boolean(
    errors.firstName ||
      errors.designation ||
      errors.age ||
      errors.purposeOfExamination ||
      Object.keys(errors.documents).length
  );
}

export function validateWitnessContact(
  draft: WitnessDraft,
  mobileInput: string,
  emailInput: string
): WitnessContactErrors {
  const errors: WitnessContactErrors = { addresses: {} };
  const mobile = normalizeMobileNumber(mobileInput);
  const email = normalizeEmail(emailInput);

  if (mobileInput.trim()) {
    if (mobile.length !== 10) {
      errors.mobileInput = "Enter a 10-digit mobile number.";
    } else if (draft.mobileNumbers.includes(mobile)) {
      errors.mobileInput = "This mobile number has already been added.";
    } else {
      errors.mobileInput =
        "Select Add number to include this mobile number.";
    }
  }

  if (emailInput.trim()) {
    if (!isValidEmail(email)) {
      errors.emailInput = "Enter a valid email address.";
    } else if (draft.emailIds.some((value) => value === email)) {
      errors.emailInput = "This email address has already been added.";
    } else {
      errors.emailInput = "Select Add email to include this email address.";
    }
  }

  for (const address of draft.addresses) {
    if (!addressHasAnyValue(address)) continue;

    const addressErrors: WitnessAddressErrors = {};
    if (!address.addressType) {
      addressErrors.addressType = "Select an address type.";
    }
    if (!/^\d{6}$/.test(address.pincode.trim())) {
      addressErrors.pincode = "Enter a 6-digit pincode.";
    }
    if (!address.state.trim()) {
      addressErrors.state = "Enter the state.";
    }
    if (!address.district.trim()) {
      addressErrors.district = "Enter the district.";
    }
    if (!address.cityOrTown.trim()) {
      addressErrors.cityOrTown = "Enter the city or town.";
    }
    if (!address.address.trim()) {
      addressErrors.address = "Enter the street or service address.";
    }

    if (Object.keys(addressErrors).length) {
      errors.addresses[address.clientId] = addressErrors;
    }
  }

  return errors;
}

export function witnessContactHasErrors(
  errors: WitnessContactErrors
): boolean {
  return Boolean(
    errors.mobileInput ||
      errors.emailInput ||
      Object.keys(errors.addresses).length
  );
}
