import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { updatePageSEO } from '../utils/seoUtils'
import { setSEO, seoConfigs } from '../utils/seo'

/**
 * SEO Head Component
 * Automatically sets SEO for pages based on route
 */
const SEOHead = ({ customSEO = null }) => {
  const location = useLocation()

  useEffect(() => {
    // Determine SEO config based on route
    let seoConfig = null

    if (customSEO) {
      seoConfig = customSEO
    } else {
      const path = location.pathname
      
      if (path === '/' || path === '/home') {
        seoConfig = seoConfigs.home
      } else if (path === '/our-mission') {
        seoConfig = seoConfigs.mission
      } else if (path === '/ai-tools') {
        seoConfig = seoConfigs.aiTools
      } else if (path === '/courses' || path.startsWith('/courses/')) {
        seoConfig = seoConfigs.courses
      } else if (path === '/login') {
        seoConfig = seoConfigs.login
      } else if (path === '/register') {
        seoConfig = seoConfigs.register
      } else {
        // Default SEO
        seoConfig = seoConfigs.home
      }
    }

    if (seoConfig) {
      setSEO({
        ...seoConfig,
        url: window.location.href,
        canonical: window.location.href
      })
      
      // Update page SEO with structured data
      const seoData = {
        title: seoConfig.title,
        description: seoConfig.description,
        keywords: seoConfig.keywords,
        openGraph: {
          title: seoConfig.title,
          description: seoConfig.description,
          image: seoConfig.image || '/skillcame.webp',
          url: window.location.href,
          type: 'website'
        },
        twitter: {
          card: 'summary_large_image',
          title: seoConfig.title,
          description: seoConfig.description,
          image: seoConfig.image || '/skillcame.webp'
        }
      }
      
      updatePageSEO(seoData)
    }
  }, [location.pathname, customSEO])

  return null
}

export default SEOHead

