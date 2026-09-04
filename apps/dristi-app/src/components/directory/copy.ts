/**
 * Copy for the firm directory surfaces. English only for the concept; the
 * rest of the access content is bilingual and this would follow if the
 * concept is green-lit. Rules carried from the whole discussion: phrase
 * everything as what happens to the person, cases by name, "group" never
 * "team", "office access" never "administrative", no em dashes.
 */

export const directoryCopy = {
  title: "People",
  subtitle:
    "Your office on DRISTI. Add people once, group them the way your firm works, and give whole groups office access to cases at a time.",
  addPeople: "Add people",
  tabPeople: "People",
  tabGroups: "Groups",
  search: "Search",
  searchPlaceholder: "Name, number or Bar ID",
  noMatches: "No one matches your search.",

  emptyTitle: "No one here yet",
  emptyBody: "Add your office to get started. Upload the list you already keep, or enter a few people one at a time.",
  emptyCta: "Add your office",

  sectionAdvocates: "Advocates",
  sectionStaff: "Clerks",
  columnPerson: "Person",
  columnCases: "Cases",
  columnGroups: "Groups",
  caseCount: (n: number) => (n === 1 ? "1 case" : `${n} cases`),
  groupCount: (n: number) => (n === 1 ? "1 group" : `${n} groups`),
  memberCount: (n: number) => (n === 1 ? "1 member" : `${n} members`),
  peopleCount: (n: number) => (n === 1 ? "1 person" : `${n} people`),
  yetToJoin: "Yet to join",
  barId: "Bar ID",
  selectAll: "Select everyone in this section",
  selectPerson: (name: string) => `Select ${name}`,
  selected: (n: number) => `${n} selected`,
  clearSelection: "Clear",
  addToGroup: "Add to group",

  /* person panel */
  closePanel: "Close",
  panelGroups: "Groups",
  notInAnyGroup: "Not in any group yet.",
  panelCases: "Cases",
  tabOffice: "Office access",
  tabVakalatnama: "Vakalatnama",
  noOfficeCases: "No office access yet. Add them to a group, or give them a case directly.",
  noVakalatCases: "Not on the vakalatnama of any of your cases.",
  removalRequestedPlain: "Removal requested",
  noCasesYet: "No case access yet. Add them to a group, or give them a case directly.",
  addToCases: "Add to cases",
  accessOffice: "Office access",
  accessVakalatnama: "Vakalatnama",
  addedThroughVakalatnama: "added through vakalatnama",
  openCase: "Open case",
  remove: "Remove",
  removalRequested: (holder: string) => `Removal requested · awaiting ${holder}`,
  accessRequested: (holder: string) => `Office access requested · awaiting ${holder}`,
  since: (date: string) => `Since ${date}`,
  invitedOn: (date: string) => `Invited on ${date}`,

  /* remove-access dialog */
  removeTitle: (name: string, kase: string) => `Remove ${name} from ${kase}?`,
  reachesThrough: (name: string, group: string) => `This case reaches ${name} through your group ${group}.`,
  reachesThroughMany: (name: string, groups: string) =>
    `This case reaches ${name} through your groups ${groups}. Either choice takes them off this case; nothing else does.`,
  optionLeaveGroup: (name: string, groups: string) => `Remove ${name} from ${groups}`,
  optionLeaveGroupAndDirect: (name: string, groups: string) => `Remove ${name} from ${groups}, and the access given directly`,
  optionLeaveGroupDetail: (n: number, many: boolean) =>
    n === 0
      ? many
        ? "They lose this case. It is the only case these groups grant."
        : "They lose this case. It is the only case the group grants."
      : n === 1
        ? `They lose this case and ${many ? "these groups'" : "the group's"} one other case:`
        : `They lose this case and ${many ? "these groups'" : "the group's"} ${n} other cases:`,
  optionDropCase: (groups: string) => `Remove this case from ${groups}`,
  optionDropCaseAndDirect: (groups: string, name: string) => `Remove this case from ${groups}, and ${name}'s direct access to it`,
  optionDropCaseDetail: (n: number, many: boolean) =>
    n === 1
      ? "The group's one member loses this case."
      : `Everyone in ${many ? "these groups" : "the group"} loses this case. ${n} people.`,
  optionDropDirect: "Remove the access you gave directly",
  optionDropDirectBy: (by: string) => `Remove the access ${by} gave directly`,
  optionDropDirectDetail: "Only this person, only this case. Groups and vakalatnama stay as they are.",
  stillThroughVakalatnama: (name: string) => `${name} still has this case through their vakalatnama.`,
  stillThroughGroup: (name: string, group: string) => `${name} still reaches this case through ${group}.`,
  vakalatnamaNote: (name: string) =>
    `Taking ${name} off the vakalatnama is a court process, one case at a time. Start it from the case, or below.`,
  removeFromVakalatnama: "Remove from the vakalatnama",
  moreCases: (n: number) => `+${n} more`,
  cancel: "Cancel",
  continue: "Continue",
  done: "Done",
  removedFromGroup: (name: string, groups: string) => `${name} is no longer in ${groups}.`,
  removedCaseFromGroup: (kase: string, groups: string) => `${kase} is no longer in ${groups}.`,
  removedDirect: (name: string, kase: string) => `${name} no longer has office access to ${kase}.`,
  grantBackHint: "Want them to keep some of those cases? Add them back one at a time from their page.",

  /* case picker */
  pickCasesTitle: (subject: string) => `Add cases for ${subject}`,
  pickCasesBody: "Everyone in the group gets office access to the cases you pick. Instantly, and only office access.",
  pickCasesBodyPerson: "Office access to the cases you pick, given directly. Instantly.",
  pickCasesSearch: "Search cases",
  pickCasesSearchPlaceholder: "Case name or number",
  alreadyHas: "Already has it",
  needsSignature: (holder: string) => `Needs ${holder}'s signature`,
  addCases: (n: number) => (n === 0 ? "Add cases" : n === 1 ? "Add 1 case" : `Add ${n} cases`),
  assignedTitle: (subject: string, n: number) =>
    n === 1 ? `${subject} → 1 case` : `${subject} → ${n} cases`,
  assignedPeople: (people: number, cases: number) =>
    `${people === 1 ? "1 person now has" : `${people} people now have`} office access to ${cases === 1 ? "this case" : "these cases"}.`,
  assignedPersonLine: (name: string, cases: number) =>
    `${name} now has office access to ${cases === 1 ? "this case" : `these ${cases} cases`}.`,
  sentToSign: (holder: string, cases: string) =>
    `You hold office access on ${cases}, so that grant went to ${holder} to sign.`,
  nothingGranted: "Nothing was granted yet.",

  /* group picker */
  addToGroupTitle: (n: number) => (n === 1 ? "Add 1 person to a group" : `Add ${n} people to a group`),
  addToGroupBody: "A group is just a named set of people. Give it cases and everyone in it gets office access.",
  existingGroups: "Your groups",
  newGroup: "New group",
  groupName: "Group name",
  groupNamePlaceholder: "Kollam NI Cases",
  groupNameError: "Give the group a name.",
  pickGroupError: "Pick a group, or create one.",
  addedToGroup: (n: number, group: string) =>
    `${n === 1 ? "1 person" : `${n} people`} added to ${group}.`,
  addedToGroupNext: "Next, give the group cases. Everyone in it gets office access at once.",
  openGroup: "Open the group",
  createAndAdd: "Create and add",
  add: "Add",

  /* groups screen */
  groupsEmptyTitle: "No groups yet",
  groupsEmptyBody: "Select people on the People tab and add them to a group. Then give the group cases.",
  groupsColumnGroup: "Group",
  groupsColumnMembers: "Members",
  groupsColumnCases: "Cases",
  groupMembers: "Members",
  groupCases: "Cases",
  addMembers: "Add members",
  assignCases: "Add cases",
  noGroupCases: "This group grants no cases yet.",
  noGroupMembers: "Nobody in this group yet.",
  removeMember: (name: string) => `Remove ${name} from the group`,
  removeCase: "Remove",
  removeCaseTitle: (kase: string, group: string) => `Remove ${kase} from ${group}?`,
  removeCaseBody: (n: number) =>
    n === 1 ? "The group's one member loses office access to this case." : `Everyone in the group loses office access to this case. ${n} people.`,
  removeMemberTitle: (name: string, group: string) => `Remove ${name} from ${group}?`,
  removeMemberBody: (n: number) =>
    n === 0
      ? "The group grants no cases yet, so nothing else changes."
      : n === 1
        ? "They lose office access to the group's one case."
        : `They lose office access to the group's ${n} cases.`,
  rename: "Rename",
  deleteGroup: "Delete group",
  deleteGroupTitle: (group: string) => `Delete ${group}?`,
  deleteGroupBody: (people: number, cases: number) =>
    `${people === 1 ? "1 person loses" : `${people} people lose`} office access to ${cases === 1 ? "1 case" : `${cases} cases`}. Any vakalatnama they hold is untouched.`,
  deleteGroupEmptyBody: "The group grants no cases, so nobody loses access.",
  groupAddsNothing: (name: string) => `${name} is on the vakalatnama of every case here. The group adds nothing for them.`,
  awaitingSignature: (holder: string) => `Awaiting ${holder}'s signature`,
  memberSince: (date: string) => `Since ${date}`,

  /* people picker (members) */
  pickPeopleTitle: (group: string) => `Add members to ${group}`,
  pickPeopleBody: "They get office access to every case the group grants.",
  alreadyMember: "Already a member",
  addPeopleCount: (n: number) => (n === 0 ? "Add" : n === 1 ? "Add 1 person" : `Add ${n} people`),

  /* add people dialog */
  addTitle: "Add people",
  addBody: "Bring your office onto DRISTI. New numbers get an SMS with a registration link; people already on DRISTI are linked.",
  chooseManual: "Add a few people",
  chooseManualBody: "One to about ten. Enter each number; DRISTI links the ones it knows and asks a name for the rest.",
  chooseUpload: "Upload a list",
  chooseUploadBody: "Your whole office at once. A CSV with names, numbers and Bar IDs.",
  manualTitle: "Add a few people",
  manualBody: "Enter a mobile number. If DRISTI knows it, the person is linked. If not, give their name.",
  phoneLabel: "Mobile number",
  phonePlaceholder: "10-digit mobile number",
  phoneError: "Enter a valid 10-digit mobile number.",
  phoneParty: (party: string, kase: string) =>
    `This number belongs to ${party}, a party on ${kase}. You can't give them office access.`,
  phoneDuplicate: "Already in the list.",
  nameLabel: "Their name",
  addName: "Add name",
  namePlaceholder: "Full name",
  barIdLabel: "Bar ID, if they are an advocate",
  barIdPlaceholder: "K/1234/2019",
  barIdError: "Bar IDs read K/1234/2019.",
  skip: "Skip",
  addPerson: "Add",
  removeChip: "Remove",
  linked: "Already on DRISTI",
  willInvite: "Will be invited",
  addThese: (n: number) => (n === 0 ? "Add people" : n === 1 ? "Add 1 person" : `Add ${n} people`),
  addedTitle: (n: number) => (n === 1 ? "1 person added" : `${n} people added`),
  addedBody: (invited: number, linked: number) =>
    [
      invited ? `${invited} will get an SMS with a registration link.` : null,
      linked ? `${linked} already on DRISTI, linked without an invite.` : null,
      "No case access yet.",
    ]
      .filter(Boolean)
      .join(" "),
  groupThemNow: "Add them to a group",
  notNow: "Not now",

  /* import wizard */
  importTitle: "Upload your office list",
  importSteps: ["Upload", "Check", "Confirm"],
  uploadBody: "A CSV with a name, a mobile number and, for advocates, a Bar ID per row. Column order does not matter; there is no template to match.",
  uploadHelp: "Upload a .csv. Names, numbers and Bar IDs are read from the content, not the headings.",
  uploadSlotLabel: "Office list",
  chooseFile: "Choose file",
  changeFile: "Change file",
  useSample: "Try the sample office list",
  parsed: (found: number, advocates: number, staff: number, attention: number) =>
    `Found ${found} people · ${advocates} advocates, ${staff} office staff, ${attention} need your attention.`,
  parsedClean: (found: number, advocates: number, staff: number) =>
    `Found ${found} people · ${advocates} advocates, ${staff} office staff. Nothing needs your attention.`,
  parseEmpty: "No people found in this file. Check that each row has a name and a mobile number.",
  checkBody: "Only the rows that need a decision. Fix them here; nothing is created until every stop is cleared.",
  checkClean: "Every row is clear.",
  rowLabel: (n: number) => `Row ${n}`,
  decisionsHeading: (n: number) => (n === 1 ? "1 row needs a decision" : `${n} rows need a decision`),
  problemDuplicate: (n: number) => `Same number as row ${n}. Two rows, one person.`,
  problemMissingName: "No name. You can't invite a nameless number.",
  problemBadMobile: "That's not a 10-digit mobile number.",
  problemBadBarId: "Bar ID looks off. Kerala IDs read K/1234/2019.",
  problemParty: (party: string, kase: string) =>
    `This number belongs to ${party}, a party on ${kase}. You can't give them office access.`,
  known: (name: string, how: "vakalatnama" | "account") =>
    how === "vakalatnama"
      ? `${name} is already on DRISTI, on a vakalatnama with you. They'll be linked, no invite sent.`
      : `${name} is already on DRISTI. They'll be linked, no invite sent.`,
  knownHeading: (n: number) => (n === 1 ? "1 person already on DRISTI" : `${n} people already on DRISTI`),
  mergeKeep: "Keep as",
  merge: "Merge",
  fix: "Fix",
  drop: "Drop row",
  keepAdvocate: "Save Bar ID",
  makeStaff: "Clear it, they're office staff",
  fixName: "Add a name",
  fixMobile: "Correct number",
  fixBarId: "Correct Bar ID",
  save: "Save",
  confirmBody: "Here is what Import will do.",
  confirmInvite: (n: number) =>
    n === 1 ? "1 person will get a registration SMS." : `${n} people will get a registration SMS.`,
  confirmLink: (n: number) =>
    n === 1 ? "1 already on DRISTI will be linked." : `${n} already on DRISTI will be linked.`,
  confirmDropped: (n: number) => (n === 1 ? "1 row dropped." : `${n} rows dropped.`),
  confirmNoAccess: "No case access is given yet. You group people and give groups cases next.",
  import: "Import",
  back: "Back",
  importedTitle: (n: number) => `${n} people are in your office`,
  importedBody: (invited: number, linked: number) =>
    `${invited} got an SMS with a registration link. ${linked} were already on DRISTI and are linked. Nothing has case access yet.`,
  groupNow: "Group them now",
  blockedNote: (n: number) => (n === 1 ? "1 row still needs a decision." : `${n} rows still need a decision.`),
};
