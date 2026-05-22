import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.offering.createMany({
    data: [
      {
        name: 'TechBF SA',
        sector: 'Technologie',
        pricePerShare: 5000,
        totalShares: 1000,
        soldShares: 340,
        minInvest: 25000,
        description: 'Startup burkinabè spécialisée dans les solutions de paiement mobile pour les PME.',
        riskLevel: 'Moyen',
        isOpen: true,
      },
      {
        name: 'AgroSahel',
        sector: 'Agriculture',
        pricePerShare: 2500,
        totalShares: 2000,
        soldShares: 1200,
        minInvest: 12500,
        description: 'Coopérative agricole produisant et exportant des produits céréaliers au Sahel.',
        riskLevel: 'Faible',
        isOpen: true,
      },
      {
        name: 'SolarBF',
        sector: 'Énergie',
        pricePerShare: 7500,
        totalShares: 500,
        soldShares: 50,
        minInvest: 37500,
        description: 'Installation de panneaux solaires pour les zones rurales non connectées au réseau.',
        riskLevel: 'Élevé',
        isOpen: true,
      },
      {
        name: 'BanqueVerte',
        sector: 'Finance',
        pricePerShare: 10000,
        totalShares: 800,
        soldShares: 600,
        minInvest: 50000,
        description: 'Microfinance dédiée aux femmes entrepreneures au Burkina Faso.',
        riskLevel: 'Faible',
        isOpen: true,
      },
      {
        name: 'ClinicGroup',
        sector: 'Santé',
        pricePerShare: 6000,
        totalShares: 600,
        soldShares: 120,
        minInvest: 30000,
        description: 'Réseau de cliniques privées abordables dans les villes secondaires.',
        riskLevel: 'Moyen',
        isOpen: true,
      },
    ],
  })
  console.log('✔ 5 offres de démo chargées')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
