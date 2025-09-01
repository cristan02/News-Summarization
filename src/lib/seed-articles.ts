import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const sampleArticles = [
  {
    title:
      "Breakthrough in Quantum Computing Brings Commercial Applications Closer",
    link: "https://example.com/quantum-computing-breakthrough",
    content: `Researchers at IBM and MIT have achieved a major breakthrough in quantum error correction, successfully maintaining quantum coherence for over 100 milliseconds in a 1000-qubit system. This advancement brings practical quantum computing applications significantly closer to reality.

The breakthrough addresses one of quantum computing's biggest challenges: quantum decoherence, where quantum states become unstable and lose their computational advantages. The new error correction protocol uses machine learning algorithms to predict and prevent errors before they occur.

"This is the moment quantum computing transitions from laboratory curiosity to practical tool," said Dr. Sarah Chen, lead researcher at IBM Quantum. "We're now seeing quantum advantage in real-world problems that matter to businesses and society."

The achievement enables quantum computers to run complex algorithms for extended periods, opening doors to applications in:
- Drug discovery and molecular simulation
- Financial modeling and risk analysis
- Climate modeling and weather prediction
- Cryptography and cybersecurity
- Supply chain optimization

IBM announced that its quantum cloud service will offer access to the new error-corrected systems starting in Q2 2025. Early partners include pharmaceutical companies working on drug discovery and financial institutions developing quantum-enhanced trading algorithms.

The milestone represents years of collaborative research between academic institutions and technology companies. The quantum error correction breakthrough could accelerate the timeline for quantum advantage across multiple industries by 3-5 years.

Major technology companies including Google, Microsoft, and Amazon have announced increased investments in quantum computing research following the breakthrough. The global quantum computing market is projected to reach $125 billion by 2030.`,
    shortSummary:
      "IBM and MIT achieve quantum computing breakthrough with 100ms coherence in 1000-qubit system, bringing commercial quantum applications closer to reality through advanced error correction.",
    tag: "artificial intelligence",
    source: "NewsAPI",
    author: "Science Reporter",
    publishedAt: new Date("2024-12-18T16:45:00Z"),
    imageUrl: "https://example.com/images/quantum-computing.jpg",
  },
  {
    title:
      "Medical Breakthrough: Gene Therapy Successfully Treats Alzheimer's Disease",
    link: "https://example.com/alzheimers-gene-therapy",
    content: `A revolutionary gene therapy treatment has shown remarkable success in treating Alzheimer's disease, with 85% of patients in Phase III clinical trials showing significant cognitive improvement. The treatment represents the first potential cure for the degenerative brain disease.

The therapy, developed by BioGenesis Therapeutics, uses modified viruses to deliver protective genes directly to brain cells affected by Alzheimer's. The treatment targets amyloid plaques and tau tangles, the hallmark characteristics of the disease.

"This is the breakthrough we've been working toward for decades," said Dr. Patricia Williams, lead researcher at Johns Hopkins Medical Center. "For the first time, we're not just slowing Alzheimer's progression—we're actually reversing it."

The treatment protocol involves:
- Single injection of modified viral vectors into the cerebrospinal fluid
- Genes that produce protective proteins for brain cells
- Clearance of toxic amyloid and tau proteins
- Restoration of synaptic connections between neurons
- Improvement in memory formation and retrieval

Clinical trial results showed dramatic improvements:
- 85% of patients showed cognitive improvement within 6 months
- 70% returned to pre-disease functioning levels
- Memory test scores improved by an average of 65%
- Brain scans showed reduced amyloid plaques in 90% of patients
- No serious adverse effects were reported

The therapy is most effective in early-stage Alzheimer's but has shown promise even in moderate cases. Researchers are optimistic about treating other neurodegenerative diseases using similar approaches.

The FDA has granted breakthrough therapy designation, potentially accelerating approval to within 12 months. European and Asian regulatory agencies have begun review processes for international approval.

Patient advocacy groups have hailed the development as a game-changer for the 55 million people worldwide living with dementia. The treatment could reduce healthcare costs by trillions of dollars over the next decade.

BioGenesis Therapeutics plans to make the treatment widely available through partnerships with healthcare systems globally, with a focus on ensuring accessibility in developing countries.`,
    shortSummary:
      "Revolutionary gene therapy shows 85% success rate in Phase III Alzheimer's trials, representing first potential cure by targeting amyloid plaques and restoring brain function.",
    tag: "health",
    source: "NewsAPI",
    author: "Medical Correspondent",
    publishedAt: new Date("2024-12-27T15:10:00Z"),
    imageUrl: "https://example.com/images/alzheimers-therapy.jpg",
  },
];

export async function seedArticles() {
  try {
    console.log("Starting to seed articles with single-tag structure...");

    for (const article of sampleArticles) {
      await prisma.article.upsert({
        where: {
          link: article.link,
        },
        update: {
          title: article.title,
          content: article.content,
          shortSummary: article.shortSummary,
          tag: article.tag,
          source: article.source,
          author: article.author,
          publishedAt: article.publishedAt,
          imageUrl: article.imageUrl,
        },
        create: {
          title: article.title,
          link: article.link,
          content: article.content,
          shortSummary: article.shortSummary,
          tag: article.tag,
          source: article.source || "Seed Data",
          author: article.author || "Unknown",
          publishedAt: article.publishedAt || new Date(),
          imageUrl: article.imageUrl,
        },
      });
      console.log(`Upserted article: ${article.title} (Tag: ${article.tag})`);
    }

    console.log("Successfully seeded all articles!");
  } catch (error) {
    console.error("Error seeding articles:", error);
    throw error;
  }
}

// Run directly if this file is executed
if (require.main === module) {
  seedArticles();
}
