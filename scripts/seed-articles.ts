import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const sampleArticles = [
  {
    title: "Breakthrough in Quantum Computing: New Algorithm Achieves Record Performance",
    link: "https://example.com/quantum-breakthrough",
    content: `Researchers at MIT have developed a revolutionary quantum computing algorithm that promises to solve complex optimization problems exponentially faster than classical computers. The new algorithm, dubbed "QuantumOpt," demonstrates unprecedented performance in handling logistics, financial modeling, and machine learning tasks.

The breakthrough comes after years of research into quantum error correction and coherence stability. Dr. Sarah Chen, lead researcher on the project, explains that the algorithm leverages quantum superposition in a novel way to explore multiple solution paths simultaneously.

"What makes QuantumOpt unique is its ability to maintain quantum coherence for extended periods while performing complex calculations," Chen stated during the announcement at the International Quantum Computing Conference.

The algorithm has been tested on various real-world problems, including supply chain optimization for major retailers and portfolio optimization for investment firms. In trials, it achieved solutions that were 1000x faster than the best classical algorithms while maintaining 99.7% accuracy.

Major tech companies including Google, IBM, and Amazon have already expressed interest in licensing the technology. The research team expects commercial applications to be available within the next 18 months.

The implications extend beyond computing efficiency. Climate modeling, drug discovery, and cryptographic security could all benefit from this advancement. The algorithm's ability to process vast datasets and identify patterns could accelerate scientific discovery across multiple fields.`,
    shortSummary: "MIT researchers develop QuantumOpt algorithm that solves optimization problems 1000x faster than classical computers, with potential applications in logistics, finance, and scientific research.",
    tags: ["Technology", "Quantum Computing", "MIT", "Algorithm", "Research"]
  },
  {
    title: "Global Climate Summit Reaches Historic Agreement on Carbon Neutrality",
    link: "https://example.com/climate-summit-agreement",
    content: `World leaders at COP29 have reached a landmark agreement committing to achieve global carbon neutrality by 2045, five years ahead of previous targets. The agreement includes binding commitments from 195 countries and establishes the largest climate fund in history.

The $500 billion climate fund will support developing nations in their transition to renewable energy and help vulnerable communities adapt to climate change impacts. The fund represents a tripling of previous climate finance commitments.

Key provisions of the agreement include:
- Mandatory 50% emissions reduction by 2030
- Phase-out of coal power by 2035
- $200 billion annual investment in renewable energy infrastructure
- Protection of 30% of global land and ocean areas
- Establishment of a global carbon pricing mechanism

UN Secretary-General António Guterres called the agreement "a turning point in human history" and emphasized the urgent need for implementation. "We have the roadmap; now we must deliver with unprecedented speed and scale," he said.

The agreement faced initial resistance from major oil-producing nations but ultimately gained unanimous support after the inclusion of a "just transition" framework that provides economic support for fossil fuel-dependent communities.

Environmental groups have cautiously welcomed the agreement while emphasizing the importance of rapid implementation. Greta Thunberg noted that "promises must now become action" and called for immediate policy changes at the national level.

Business leaders have responded positively, with many companies already announcing accelerated sustainability timelines to align with the new targets.`,
    shortSummary: "COP29 climate summit achieves historic agreement with 195 countries committing to carbon neutrality by 2045, backed by $500 billion climate fund and binding emissions reduction targets.",
    tags: ["Climate", "Environment", "Politics", "Global", "Sustainability"]
  },
  {
    title: "SpaceX Successfully Lands First Crew on Mars After 7-Month Journey",
    link: "https://example.com/spacex-mars-landing",
    content: `In a historic moment for space exploration, SpaceX's Starship successfully landed the first human crew on Mars after a 7-month journey from Earth. The four-person crew aboard "New Horizons" touched down in Amazonis Planitia at 14:32 UTC today.

Commander Sarah Rodriguez, pilot Chen Wei, mission specialist Dr. James Kumar, and systems engineer Maria Santos are the first humans to set foot on another planet. The crew will spend 26 months on Mars conducting scientific research and establishing the foundation for a permanent human presence.

The mission, designated Artemis-Mars 1, launched from SpaceX's Starbase facility in Texas seven months ago. The journey included a complex trajectory using gravity assists from Venus and Earth to minimize fuel consumption and travel time.

"This is a giant leap not just for SpaceX, but for all of humanity," said Elon Musk during the live broadcast. "Today we become a truly multi-planetary species."

The crew's primary objectives include:
- Establishing a sustainable habitat using in-situ resource utilization
- Conducting geological surveys to understand Mars' history
- Searching for signs of past or present microbial life
- Testing life support systems for future permanent settlements
- Preparing landing sites for cargo missions arriving in 2026

The mission utilizes SpaceX's revolutionary closed-loop life support system, which recycles 98% of water and oxygen. Solar panels and a small nuclear reactor provide power for the habitat and scientific equipment.

NASA Administrator Bill Nelson praised the achievement, noting the international collaboration that made the mission possible. The crew includes expertise from NASA, ESA, and private space companies.

Earth-Mars communication delay is currently 14 minutes, making real-time mission control impossible. The crew operates with significant autonomy while following detailed mission protocols developed over the past decade.`,
    shortSummary: "SpaceX achieves historic milestone as four-person crew successfully lands on Mars after 7-month journey, beginning 26-month mission to establish foundation for permanent human presence.",
    tags: ["Space", "Mars", "SpaceX", "Exploration", "Science"]
  },
  {
    title: "Revolutionary Gene Therapy Cures Type 1 Diabetes in Clinical Trial",
    link: "https://example.com/gene-therapy-diabetes",
    content: `A groundbreaking gene therapy treatment has successfully cured Type 1 diabetes in 90% of participants in a Phase III clinical trial, offering hope to millions of patients worldwide. The treatment, developed by biotech company GeneLife Therapeutics, reprograms the patient's own cells to produce insulin.

The therapy uses CRISPR-Cas9 gene editing technology to modify liver cells, converting them into insulin-producing beta cells that respond to blood glucose levels. Unlike traditional treatments requiring daily insulin injections, the gene therapy provides a one-time cure.

"We're witnessing a medical revolution," said Dr. Patricia Williams, lead investigator at Johns Hopkins Medical Center. "Patients who have lived with diabetes for decades are now producing their own insulin naturally."

The trial followed 200 patients aged 18-65 with Type 1 diabetes for 24 months. Results showed:
- 180 patients (90%) achieved normal blood glucose without medication
- 15 patients (7.5%) reduced insulin requirements by 80%
- 5 patients (2.5%) showed no improvement
- No serious adverse effects were reported

The treatment involves a single IV infusion of modified viral vectors carrying the therapeutic genes. The vectors specifically target liver cells, avoiding off-target effects in other organs. Patients begin producing insulin within 2-4 weeks of treatment.

Twenty-eight-year-old trial participant Mark Thompson shared his experience: "I was diagnosed at age 12 and have given myself over 20,000 insulin injections. Three months after the gene therapy, my pancreas function tests show I'm producing insulin like someone without diabetes."

The FDA has granted breakthrough therapy designation, potentially accelerating approval to within 12 months. The company expects to file for regulatory approval in Q2 2025.

Cost remains a concern, with estimates suggesting the treatment could cost $500,000-$1,000,000 per patient. However, analysts note this could be cost-effective compared to lifetime diabetes management costs exceeding $300,000.

International regulatory agencies in Europe and Canada have begun reviewing preliminary data for potential approval.`,
    shortSummary: "Revolutionary CRISPR gene therapy achieves 90% cure rate for Type 1 diabetes in clinical trial, reprogramming liver cells to produce insulin and potentially eliminating need for daily injections.",
    tags: ["Medicine", "Gene Therapy", "Diabetes", "CRISPR", "Healthcare"]
  },
  {
    title: "Major Cybersecurity Breach Affects 500 Million Users Across Multiple Platforms",
    link: "https://example.com/cybersecurity-breach",
    content: `A sophisticated cyber attack has compromised personal data of over 500 million users across multiple social media and e-commerce platforms in what security experts are calling one of the largest data breaches in history. The attack, discovered early Tuesday morning, affected platforms including several major social networks, online retailers, and financial services.

The breach was carried out by an advanced persistent threat (APT) group using a zero-day vulnerability in widely-used cloud infrastructure software. The attackers gained access to user databases containing names, email addresses, phone numbers, and in some cases, encrypted passwords and payment information.

"This attack demonstrates unprecedented sophistication and coordination," said cybersecurity expert Dr. Michael Rodriguez from the Cybersecurity and Infrastructure Security Agency (CISA). "The attackers exploited a previously unknown vulnerability that has since been patched."

Affected companies have begun notifying users and implementing additional security measures:
- Mandatory password resets for all affected accounts
- Enhanced two-factor authentication requirements
- Credit monitoring services for users whose financial data was accessed
- Collaboration with law enforcement agencies

The breach timeline reveals the attack began three weeks ago but remained undetected due to sophisticated methods used to mask the intrusion. The hackers used legitimate administrative tools and mimicked normal user behavior to avoid triggering security alerts.

"What's particularly concerning is the attackers' ability to remain hidden for an extended period," noted cybersecurity firm SecureNet's CEO Jennifer Park. "This suggests nation-state level capabilities and resources."

No evidence has been found of credit card numbers or Social Security numbers being accessed, as this data is stored separately with additional encryption layers. However, users are advised to monitor their accounts closely and enable all available security features.

The incident has renewed calls for stronger federal cybersecurity regulations and mandatory breach notification requirements. Several congressional committees have announced investigations into the companies' security practices.

Stock prices for affected companies fell 5-15% in after-hours trading as investors assessed potential legal and regulatory consequences. The companies face potential fines under GDPR and other international privacy regulations.

Users can check if their accounts were affected by visiting the companies' security notification pages and are encouraged to use unique passwords and multi-factor authentication for all online accounts.`,
    shortSummary: "Sophisticated cyber attack compromises 500 million user accounts across multiple platforms using zero-day vulnerability, marking one of the largest data breaches in history with widespread implications for online security.",
    tags: ["Cybersecurity", "Data Breach", "Privacy", "Technology", "Security"]
  }
]

export async function seedArticles() {
  try {
    console.log('Starting to seed articles...')
    
    for (const article of sampleArticles) {
      await prisma.article.create({
        data: article
      })
      console.log(`Created article: ${article.title}`)
    }
    
    console.log('Successfully seeded all articles!')
  } catch (error) {
    console.error('Error seeding articles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run directly if this file is executed
if (require.main === module) {
  seedArticles()
}
