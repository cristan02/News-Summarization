import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const sampleArticles = [
  {
    title: "Apple Announces Revolutionary AI Chip for Next-Generation Devices",
    link: "https://example.com/apple-ai-chip",
    content: `Apple has unveiled its most advanced AI processing chip, the A18 Neural, designed to power next-generation artificial intelligence applications across its device ecosystem. The new chip features a 40-core Neural Engine capable of performing 40 trillion operations per second.

The A18 Neural represents a significant leap in on-device AI processing, enabling real-time language translation, advanced photo editing, and personalized user experiences without relying on cloud computing. This advancement addresses growing privacy concerns while delivering unprecedented performance.

"We're entering a new era of personal computing where AI becomes truly personal," said CEO Tim Cook during the announcement at Apple Park. "The A18 Neural brings the power of artificial intelligence directly to your device, ensuring your data stays private while delivering incredible capabilities."

Key features of the A18 Neural include:
- 40-core Neural Engine with 40 TOPS performance
- Advanced machine learning accelerators
- Improved power efficiency for all-day battery life
- Support for large language models up to 7 billion parameters
- Real-time video processing and enhancement

The chip will debut in the iPhone 16 Pro series, scheduled for release in early 2025. Apple has also announced plans to integrate the technology into MacBooks and iPads by mid-2025.

Industry analysts predict this could shift the competitive landscape, as on-device AI processing becomes increasingly important for privacy-conscious consumers. The announcement caused Apple stock to rise 3.2% in after-hours trading.`,
    shortSummary: "Apple unveils A18 Neural chip with 40-core Neural Engine for advanced on-device AI processing, featuring 40 TOPS performance and privacy-focused computing capabilities.",
    tag: "apple",
    source: "NewsAPI",
    author: "Tech Reporter",
    publishedAt: new Date('2024-12-15T10:00:00Z'),
    imageUrl: "https://example.com/images/apple-ai-chip.jpg"
  },
  {
    title: "Tesla Reports Record Quarterly Deliveries Amid Global Expansion",
    link: "https://example.com/tesla-quarterly-deliveries",
    content: `Tesla has reported record quarterly vehicle deliveries of 485,000 units in Q4 2024, surpassing analyst expectations and marking a 35% increase from the previous year. The milestone reflects the company's successful global expansion strategy and improved production efficiency.

The record deliveries were driven by strong performance across all vehicle models, with the Model Y leading sales in the crossover segment. Tesla's Gigafactories in Shanghai, Berlin, and Texas all contributed to the production surge, with the Austin facility reaching full operational capacity.

"This quarter represents a turning point for sustainable transportation," said CEO Elon Musk in a statement. "We're not just meeting demand; we're accelerating the world's transition to sustainable energy at an unprecedented pace."

Breakdown of Q4 2024 deliveries:
- Model S/X: 25,000 units (+15% year-over-year)
- Model 3/Y: 460,000 units (+37% year-over-year)
- Cybertruck: Initial deliveries began with 2,500 units

The company also announced plans to launch the affordable Model 2 in 2025, targeting a $25,000 price point to make electric vehicles accessible to a broader market. Pre-orders for the Model 2 are expected to begin in Q2 2025.

Tesla's energy division also saw significant growth, with solar panel installations increasing 40% and Powerwall deployments reaching record levels. The company's Supercharger network expanded to over 50,000 charging stations globally.

Investors responded positively to the news, with Tesla shares climbing 8.5% in pre-market trading. The results position Tesla to potentially deliver over 2 million vehicles annually by 2025.`,
    shortSummary: "Tesla achieves record Q4 2024 deliveries of 485,000 vehicles, exceeding expectations with 35% year-over-year growth and announcing plans for affordable Model 2 in 2025.",
    tag: "tesla",
    source: "NewsAPI",
    author: "Business Correspondent",
    publishedAt: new Date('2024-12-20T14:30:00Z'),
    imageUrl: "https://example.com/images/tesla-deliveries.jpg"
  },
  {
    title: "Breakthrough in Quantum Computing Brings Commercial Applications Closer",
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
    shortSummary: "IBM and MIT achieve quantum computing breakthrough with 100ms coherence in 1000-qubit system, bringing commercial quantum applications closer to reality through advanced error correction.",
    tag: "quantum-computing",
    source: "NewsAPI",
    author: "Science Reporter",
    publishedAt: new Date('2024-12-18T16:45:00Z'),
    imageUrl: "https://example.com/images/quantum-computing.jpg"
  },
  {
    title: "Global Climate Fund Reaches $500 Billion Milestone for Renewable Energy",
    link: "https://example.com/climate-fund-milestone",
    content: `The International Climate Finance Initiative has successfully raised $500 billion in commitments for renewable energy projects worldwide, surpassing its 2025 target one year ahead of schedule. The fund represents the largest coordinated effort to combat climate change through clean energy investment.

The milestone was announced at the World Economic Forum in Davos, with contributions from 195 countries, multilateral development banks, and private investors. The fund will finance solar, wind, hydroelectric, and emerging clean energy technologies across developing and developed nations.

"Today marks a turning point in our fight against climate change," said UN Climate Chief Patricia Espinosa. "This unprecedented level of financial commitment demonstrates global unity in transitioning to a sustainable energy future."

The fund allocation includes:
- $200 billion for solar energy projects in developing countries
- $150 billion for offshore wind farms globally
- $75 billion for grid modernization and energy storage
- $50 billion for emerging technologies like green hydrogen
- $25 billion for climate adaptation and resilience projects

Priority regions include sub-Saharan Africa, Southeast Asia, and Latin America, where renewable energy access remains limited. The fund aims to provide electricity to 1 billion people currently without reliable power access.

Major commitments came from developed nations, with the United States contributing $100 billion, the European Union $120 billion, and China $80 billion. Private sector participation exceeded expectations, with technology companies and financial institutions providing over $150 billion.

The initiative includes ambitious targets: achieving 70% renewable energy globally by 2030 and complete decarbonization of the electricity sector by 2040. Early projects are already underway, with the first solar installations beginning in Kenya and Bangladesh.

Environmental groups praised the announcement while emphasizing the need for rapid implementation and transparent monitoring of fund utilization.`,
    shortSummary: "International Climate Finance Initiative reaches $500 billion milestone for global renewable energy projects, with commitments from 195 countries targeting 70% renewable energy by 2030.",
    tag: "climate-change",
    source: "NewsAPI",
    author: "Environment Correspondent",
    publishedAt: new Date('2024-12-22T11:20:00Z'),
    imageUrl: "https://example.com/images/climate-fund.jpg"
  },
  {
    title: "SpaceX Successfully Completes First Commercial Mars Cargo Mission",
    link: "https://example.com/spacex-mars-cargo",
    content: `SpaceX has successfully completed its first commercial cargo mission to Mars, delivering 100 tons of supplies and equipment to the Mars Base Alpha research station. The mission marks a significant milestone in establishing permanent human presence on the Red Planet.

The cargo mission, launched 18 months ago during the optimal Earth-Mars transfer window, included life support equipment, scientific instruments, solar panels, and construction materials for expanding the Mars base. The successful delivery demonstrates the viability of regular cargo runs to support Mars colonization.

"This mission proves that interplanetary commerce is no longer science fiction," said SpaceX CEO Elon Musk. "We're building the infrastructure for a multi-planetary civilization, one cargo shipment at a time."

The delivered cargo includes:
- Advanced life support systems for 50 additional crew members
- Mining equipment for water extraction and fuel production
- Laboratory equipment for biological and geological research
- Construction robots for autonomous base expansion
- Emergency supplies including food, medicine, and spare parts

The mission utilized SpaceX's heavy-lift Starship vehicle, specifically designed for Mars transport. The spacecraft successfully landed at Mars Base Alpha using precision guidance systems, despite challenging dust storm conditions.

Mars Base Alpha, established in 2024, currently houses 12 researchers conducting long-term studies on Mars geology, climate, and potential for terraforming. The base serves as a testbed for technologies needed for permanent Mars settlements.

The successful cargo delivery has attracted interest from multiple organizations planning Mars missions. NASA has contracted SpaceX for three additional cargo missions, while private research institutions and mining companies are exploring opportunities for Mars-based operations.

Future cargo missions will focus on delivering heavy industrial equipment for fuel production and mining operations. SpaceX plans to launch cargo missions every 26 months during optimal transfer windows, with the goal of establishing a self-sustaining Mars economy by 2035.`,
    shortSummary: "SpaceX completes first commercial Mars cargo mission, delivering 100 tons of supplies to Mars Base Alpha and demonstrating viability of regular interplanetary commerce.",
    tag: "space-exploration",
    source: "NewsAPI",
    author: "Space Correspondent",
    publishedAt: new Date('2024-12-25T09:15:00Z'),
    imageUrl: "https://example.com/images/spacex-mars.jpg"
  },
  {
    title: "Major Cybersecurity Firms Report 300% Increase in AI-Powered Attacks",
    link: "https://example.com/ai-cybersecurity-attacks",
    content: `Leading cybersecurity companies report a 300% increase in artificial intelligence-powered cyberattacks over the past year, marking a significant evolution in the threat landscape. The attacks use machine learning to adapt in real-time and bypass traditional security measures.

The surge in AI-powered attacks includes sophisticated phishing campaigns, automated vulnerability exploitation, and deepfake-enabled social engineering. Cybercriminals are leveraging readily available AI tools to scale their operations and improve success rates.

"We're witnessing the weaponization of artificial intelligence," said Dr. Michael Rodriguez, Chief Security Officer at CyberDefense Global. "Traditional signature-based security is becoming obsolete against these adaptive threats."

Common AI-powered attack methods include:
- Automated spear-phishing with personalized content generation
- Real-time password cracking using neural networks
- Deepfake voice calls for CEO fraud and social engineering
- AI-generated malware that evolves to evade detection
- Automated network reconnaissance and exploitation

The financial sector has been particularly targeted, with AI attacks on banking systems increasing 450% year-over-year. Healthcare and critical infrastructure have also seen significant increases in sophisticated attacks.

In response, cybersecurity firms are deploying AI-powered defense systems that can learn and adapt to new threats in real-time. The global cybersecurity market is projected to grow by 35% annually as organizations upgrade their defenses.

Government agencies are developing new regulations for AI security, including mandatory reporting of AI-powered attacks and requirements for AI-resistant security measures in critical infrastructure.

Organizations are advised to implement zero-trust security models, regular security training with AI-aware components, and advanced threat detection systems capable of identifying AI-generated attacks.

The cybersecurity skills shortage has intensified as demand for AI-security expertise grows. Universities and training programs are rapidly developing specialized curricula to address the emerging threat landscape.`,
    shortSummary: "Cybersecurity firms report 300% surge in AI-powered cyberattacks, with criminals using machine learning for adaptive phishing, malware, and social engineering campaigns.",
    tag: "cybersecurity",
    source: "NewsAPI",
    author: "Security Analyst",
    publishedAt: new Date('2024-12-28T13:40:00Z'),
    imageUrl: "https://example.com/images/ai-cybersecurity.jpg"
  },
  {
    title: "Cryptocurrency Market Reaches New High as Bitcoin Surpasses $120,000",
    link: "https://example.com/bitcoin-120k-milestone",
    content: `Bitcoin has reached a historic milestone, surpassing $120,000 per coin for the first time, driven by increased institutional adoption and growing acceptance of cryptocurrency as a legitimate asset class. The surge represents a 400% increase from last year's lows.

The rally was fueled by several major developments: approval of Bitcoin ETFs in multiple countries, adoption by sovereign wealth funds, and integration of cryptocurrency payments by major corporations. Institutional investors now hold over 15% of the total Bitcoin supply.

"We're witnessing the maturation of cryptocurrency from speculative asset to institutional-grade investment," said Jennifer Park, CEO of Crypto Analytics. "The infrastructure and regulatory clarity have finally caught up with the technology's potential."

Key drivers of the price surge include:
- US Federal Reserve's favorable regulatory framework
- Adoption by pension funds and endowments
- Corporate treasury allocation by Fortune 500 companies
- Growing acceptance in emerging markets
- Technical improvements in Bitcoin network efficiency

The cryptocurrency market's total value has exceeded $5 trillion, with Bitcoin maintaining its dominant 45% market share. Ethereum and other altcoins have also seen significant gains, though none have matched Bitcoin's percentage increases.

Major corporations including Microsoft, Apple, and JPMorgan have announced plans to add Bitcoin to their treasury reserves. Several central banks are exploring Bitcoin as a reserve asset alongside traditional currencies.

The price milestone has renewed discussions about Bitcoin's role in the global financial system. Proponents argue it provides protection against inflation and currency devaluation, while critics express concerns about volatility and environmental impact.

Mining operations have evolved to become predominantly renewable energy-powered, addressing environmental concerns that previously limited institutional adoption. Over 75% of Bitcoin mining now uses renewable energy sources.

Financial advisors are recommending allocation of 5-10% of portfolios to cryptocurrency, marking a significant shift from previous skepticism about digital assets.`,
    shortSummary: "Bitcoin reaches historic $120,000 milestone driven by institutional adoption, regulatory clarity, and corporate treasury allocation, with crypto market value exceeding $5 trillion.",
    tag: "cryptocurrency",
    source: "NewsAPI",
    author: "Financial Reporter",
    publishedAt: new Date('2024-12-30T10:25:00Z'),
    imageUrl: "https://example.com/images/bitcoin-120k.jpg"
  },
  {
    title: "Medical Breakthrough: Gene Therapy Successfully Treats Alzheimer's Disease",
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
    shortSummary: "Revolutionary gene therapy shows 85% success rate in Phase III Alzheimer's trials, representing first potential cure by targeting amyloid plaques and restoring brain function.",
    tag: "medical-research",
    source: "NewsAPI",
    author: "Medical Correspondent",
    publishedAt: new Date('2024-12-27T15:10:00Z'),
    imageUrl: "https://example.com/images/alzheimers-therapy.jpg"
  }
]

export async function seedArticles() {
  try {
    console.log('Starting to seed articles with single-tag structure...')
    
    for (const article of sampleArticles) {
      await prisma.article.upsert({
        where: {
          link: article.link
        },
        update: {
          title: article.title,
          content: article.content,
          shortSummary: article.shortSummary,
          tag: article.tag,
          source: article.source,
          author: article.author,
          publishedAt: article.publishedAt,
          imageUrl: article.imageUrl
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
          imageUrl: article.imageUrl
        }
      })
      console.log(`Upserted article: ${article.title} (Tag: ${article.tag})`)
    }
    
    console.log('Successfully seeded all articles!')
  } catch (error) {
    console.error('Error seeding articles:', error)
    throw error
  }
}

// Run directly if this file is executed
if (require.main === module) {
  seedArticles()
}
