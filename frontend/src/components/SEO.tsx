import { Helmet } from 'react-helmet-async'

interface SEOProps {
    title?: string
    description?: string
    canonical?: string
    noindex?: boolean
}

const DEFAULT_TITLE = 'FinControl Pro'
const DEFAULT_DESCRIPTION = 'Controle financeiro inteligente para casais e famílias. Gerencie despesas, receitas, investimentos e metas financeiras.'

export function SEO({ title, description, canonical, noindex = false }: SEOProps) {
    const fullTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE
    const metaDescription = description || DEFAULT_DESCRIPTION

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            {canonical && <link rel="canonical" href={canonical} />}
            {noindex && <meta name="robots" content="noindex, nofollow" />}
        </Helmet>
    )
}
