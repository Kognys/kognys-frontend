# Markdown Formatting Guide for Kognys Responses

This guide shows how to format responses from the backend for optimal display in the Kognys frontend.

## Example: Well-Formatted Medical Response

Instead of a wall of text, use proper markdown formatting:

```markdown
## Microbiome-Based Therapies: Clinical Applications

### 1. Fecal Microbiota Transplantation (FMT)

**Established Clinical Application:** FMT is the most effective therapy for recurrent *Clostridioides difficile* infection (rCDI), demonstrating high success rates (exceeding 90%) and being recognized as a standard of care.

**Key Details:**
- **Specific Disease Indication:** rCDI that is unresponsive to standard therapies
- **Current Clinical Guidelines:** FMT is now explicitly part of clinical guidelines for rCDI
- **Regulatory Status:** The FDA currently exercises "enforcement discretion" for FMT when used to treat rCDI

> **Note:** For all other indications (e.g., ulcerative colitis, obesity, IBD), an IND application is required.

---

### 2. Probiotics

**Established Clinical Applications:** Probiotics have shown effectiveness in the prevention and treatment of various types of diarrhea:

- Antibiotic-associated diarrhea (AAD)
- Acute infectious diarrhea (especially in children)
- Traveler's diarrhea

**Specific Strains:**
- *Lactobacillus rhamnosus GG* has shown beneficial effects for AAD and acute infectious diarrhea in children

**Exploratory Applications** *(not yet established for widespread clinical recommendation)*:
- Managing symptoms of irritable bowel syndrome (IBS)
- Inflammatory bowel disease (IBD)
- Immune modulation
- Mental health (gut-brain axis)
- Metabolic disorders

---

### 3. Prebiotics

**Function:** Modulating the gut microbiota and improving host health by promoting the growth of beneficial bacteria.

**Common Types:**
- Fructans
- Galactooligosaccharides (GOS)

**Potential Applications:**
- Constipation
- Irritable bowel syndrome (IBS)
- Inflammatory bowel disease (IBD)

> **Limitation:** No established routine clinical applications for specific disease treatment are explicitly detailed in current guidelines.

---

### 4. Dietary Interventions

**Established Clinical Applications:**
- **Primary therapy** for active Crohn's Disease (CD) in children using enteral nutrition
- Important component in the management of Inflammatory Bowel Disease (IBD)

**Specific Diets with Promising Results:**
1. **Crohn's Disease Exclusion Diet (CDED)**
2. **Specific Carbohydrate Diet (SCD)**
3. **Mediterranean diet**

These diets have shown promising results in inducing and maintaining remission in IBD patients.

**General Principle:** A balanced diet rich in fiber and diverse plant-based foods supports a healthy microbiota.
```

## Formatting Guidelines

1. **Use Headers** to separate major sections (##) and subsections (###)
2. **Bold** important terms and categories
3. **Use Lists** for multiple items instead of comma-separated text
4. **Add Line Breaks** (---) between major sections
5. **Use Blockquotes** (>) for important notes or limitations
6. **Italicize** scientific names and Latin terms
7. **Structure Information** with clear categories like "Established", "Exploratory", "Key Details"
8. **Use Nested Lists** for hierarchical information

## Benefits

- ✅ Easy to scan and find specific information
- ✅ Clear visual hierarchy
- ✅ Better accessibility
- ✅ Professional appearance
- ✅ Improved user experience

## Implementation

The frontend already supports all these markdown features. The backend should format responses using proper markdown syntax for optimal display.