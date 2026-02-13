"""
Test PubChem ATC classification retrieval for common drugs
"""

import pubchempy as pcp
import requests
import json
import time

def get_atc_from_pubchem(drug_name):
    """Get ATC classification from PubChem"""
    try:
        # First get the compound
        compounds = pcp.get_compounds(drug_name, 'name')
        if not compounds:
            return None
        
        cid = compounds[0].cid
        
        # Get ATC codes from PubChem using PUG-View API
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            return None
        
        data = response.json()
        
        # Navigate through the JSON to find ATC codes
        atc_codes = []
        try:
            sections = data['Record']['Section']
            for section in sections:
                if 'Section' in section:
                    for subsection in section['Section']:
                        if subsection.get('TOCHeading') == 'ATC Code':
                            if 'Information' in subsection:
                                for info in subsection['Information']:
                                    if 'Value' in info and 'StringWithMarkup' in info['Value']:
                                        for item in info['Value']['StringWithMarkup']:
                                            if 'String' in item:
                                                atc_codes.append(item['String'])
        except (KeyError, TypeError):
            pass
        
        return atc_codes if atc_codes else None
        
    except Exception as e:
        print(f"Error getting ATC for {drug_name}: {e}")
        return None

# Test with common drugs
test_drugs = [
    "Aspirin", "Warfarin", "Metformin", "Ibuprofen", 
    "Lisinopril", "Atorvastatin", "Omeprazole", "Sertraline"
]

print("="*80)
print("TESTING ATC CLASSIFICATION RETRIEVAL FROM PUBCHEM")
print("="*80)

results = {}
for drug in test_drugs:
    print(f"\nTesting: {drug}...")
    atc = get_atc_from_pubchem(drug)
    results[drug] = atc
    if atc:
        print(f"  ATC Codes: {atc}")
        # ATC structure: Level 1 (1 char), Level 2 (2 chars), Level 3 (3 chars), Level 4 (4 chars), Level 5 (5 chars)
        for code in atc:
            print(f"    - {code}")
            if len(code) >= 1:
                print(f"      Level 1 (Anatomical): {code[0]}")
            if len(code) >= 3:
                print(f"      Level 2 (Therapeutic): {code[:3]}")
            if len(code) >= 4:
                print(f"      Level 3 (Pharmacological): {code[:4]}")
            if len(code) >= 5:
                print(f"      Level 4 (Chemical): {code[:5]}")
            if len(code) == 7:
                print(f"      Level 5 (Substance): {code}")
    else:
        print(f"  No ATC codes found")
    
    time.sleep(0.5)  # Rate limiting

# Save results
with open('atc_test_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\n" + "="*80)
print("Results saved to 'atc_test_results.json'")
print("="*80)
