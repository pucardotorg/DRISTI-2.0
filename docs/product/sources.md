# Legal source corpus

Snapshot: 2026-07-30. For the §138 cheque-dishonour profile on the
[domain model site](https://dristidomain.netlify.app/).

Acts are held as **Akoma Ntoso** XML (international legal-document standard), each paired
with its source PDF.

## Pre / post 1 July 2024 pairing

| Domain | Pre-2024-07-01 | Post-2024-07-01 |
|---|---|---|
| Procedure | Code of Criminal Procedure, 1973 (CrPC) | Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) |
| Penal | Indian Penal Code, 1860 (IPC) | Bharatiya Nyaya Sanhita, 2023 (BNS) |
| Evidence | Indian Evidence Act, 1872 (IEA) | Bharatiya Sakshya Adhiniyam, 2023 (BSA) |

Applicability for a case follows the **cause-of-action date** (when the cheque bounced),
not the filing or hearing date. See [architecture.md](architecture.md).

## Always-applicable (among others)

- Negotiable Instruments Act, 1881 (substantive offence)
- Constitution of India
- General Clauses Act, 1897
- Limitation Act, 1963
- Probation of Offenders Act, 1958
- IT Act, 2000
- Payment and Settlement Systems Act, 2007 (banking context)
- Bankers' Books Evidence Act, 1891
- Advocates Act, 1961
- Police Act, 1861
- Oaths Act, 1969
- Notaries Act, 1952
- Legal Services Authorities Act, 1987
- Rights of Persons with Disabilities Act, 2016
- Code of Civil Procedure, 1908

The §138 profile models **108 provisions across 21 Acts**.

## Caveat

Section numbers in the domain data were extracted from India Code reprint PDFs —
**verify against the official source** before relying on them for anything authoritative.
Full statutory text lives in the domain site's `data/` (AKN XML + PDFs), not in these
orientation docs.
