/**
 * Listing Validation Unit Tests
 * 
 * Tests for listing creation, update, and publishing validation.
 */

import {
  validateCreateListing,
  validatePricing,
  validateAvailability,
  validateCurrencyCountryMatch,
} from '../listing-validation'

describe('Listing Validation', () => {
  describe('validateCreateListing', () => {
    const validListing = {
      title: 'John Deere 6150M Tractor',
      description: 'Well-maintained tractor perfect for medium-sized farms. Includes front loader attachment.',
      category: 'TRACTOR',
      country: 'NZ',
      region: 'Canterbury',
      currency: 'NZD',
      pricePerDay: 450,
      insuranceMode: 'OWNER_PROVIDED',
    }

    it('should validate a complete listing', () => {
      const result = validateCreateListing(validListing)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return warnings for missing optional fields', () => {
      const result = validateCreateListing(validListing)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.field === 'brand')).toBe(true)
    })

    describe('Title Validation', () => {
      it('should reject title shorter than 5 characters', () => {
        const result = validateCreateListing({ ...validListing, title: 'Test' })
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.field === 'title')).toBe(true)
      })

      it('should reject title longer than 100 characters', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          title: 'A'.repeat(101) 
        })
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.field === 'title')).toBe(true)
      })

      it('should reject title with invalid characters', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          title: 'Tractor <script>alert("xss")</script>' 
        })
        expect(result.valid).toBe(false)
      })
    })

    describe('Description Validation', () => {
      it('should reject description shorter than 20 characters', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          description: 'Too short' 
        })
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.field === 'description')).toBe(true)
      })

      it('should reject description longer than 5000 characters', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          description: 'A'.repeat(5001) 
        })
        expect(result.valid).toBe(false)
      })
    })

    describe('Category Validation', () => {
      it('should accept valid categories', () => {
        const categories = ['TRACTOR', 'HARVESTER', 'SPRAYER', 'LOADER', 'OTHER']
        categories.forEach(category => {
          const result = validateCreateListing({ ...validListing, category })
          expect(result.valid).toBe(true)
        })
      })

      it('should reject invalid category', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          category: 'INVALID_CATEGORY' 
        })
        expect(result.valid).toBe(false)
      })
    })

    describe('Pricing Validation', () => {
      it('should reject negative price', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          pricePerDay: -100 
        })
        expect(result.valid).toBe(false)
      })

      it('should reject zero price', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          pricePerDay: 0 
        })
        expect(result.valid).toBe(false)
      })

      it('should reject price exceeding maximum', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          pricePerDay: 150000 
        })
        expect(result.valid).toBe(false)
      })

      it('should accept valid weekly price', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          pricePerWeek: 2500 
        })
        expect(result.valid).toBe(true)
      })
    })

    describe('Location Validation', () => {
      it('should accept NZ country', () => {
        const result = validateCreateListing({ ...validListing, country: 'NZ' })
        expect(result.valid).toBe(true)
      })

      it('should accept AU country', () => {
        const result = validateCreateListing({ ...validListing, country: 'AU' })
        expect(result.valid).toBe(true)
      })

      it('should reject invalid country', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          country: 'US' 
        })
        expect(result.valid).toBe(false)
      })

      it('should require region', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          region: '' 
        })
        expect(result.valid).toBe(false)
      })
    })

    describe('Insurance Mode Validation', () => {
      it('should accept OWNER_PROVIDED', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          insuranceMode: 'OWNER_PROVIDED' 
        })
        expect(result.valid).toBe(true)
      })

      it('should accept RENTER_PROVIDED', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          insuranceMode: 'RENTER_PROVIDED' 
        })
        expect(result.valid).toBe(true)
      })

      it('should accept NONE', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          insuranceMode: 'NONE' 
        })
        expect(result.valid).toBe(true)
      })

      it('should reject invalid insurance mode', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          insuranceMode: 'INVALID' 
        })
        expect(result.valid).toBe(false)
      })
    })

    describe('Optional Fields', () => {
      it('should accept valid year', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          year: 2020 
        })
        expect(result.valid).toBe(true)
      })

      it('should reject year before 1900', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          year: 1899 
        })
        expect(result.valid).toBe(false)
      })

      it('should reject future year', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          year: new Date().getFullYear() + 5 
        })
        expect(result.valid).toBe(false)
      })

      it('should accept valid bond amount', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          bondAmount: 5000 
        })
        expect(result.valid).toBe(true)
      })

      it('should accept zero bond amount', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          bondAmount: 0 
        })
        expect(result.valid).toBe(true)
      })

      it('should reject negative bond amount', () => {
        const result = validateCreateListing({ 
          ...validListing, 
          bondAmount: -100 
        })
        expect(result.valid).toBe(false)
      })
    })
  })

  describe('validatePricing', () => {
    it('should pass for valid daily price only', () => {
      const result = validatePricing(450)
      expect(result.valid).toBe(true)
    })

    it('should pass for valid daily and weekly prices', () => {
      const result = validatePricing(450, 2500)
      expect(result.valid).toBe(true)
    })

    it('should warn when weekly price is not discounted', () => {
      const result = validatePricing(100, 700) // 7x daily = no discount
      expect(result.warnings.some(w => w.field === 'pricePerWeek')).toBe(true)
    })

    it('should error when weekly price is too low', () => {
      const result = validatePricing(100, 200) // Less than 3x daily
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'pricePerWeek')).toBe(true)
    })

    it('should warn for high minimum rental days', () => {
      const result = validatePricing(450, null, 45)
      expect(result.warnings.some(w => w.field === 'minimumRentalDays')).toBe(true)
    })
  })

  describe('validateAvailability', () => {
    it('should pass for valid future dates', () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 7)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)
      
      const result = validateAvailability(startDate, endDate)
      expect(result.valid).toBe(true)
    })

    it('should fail for past start date', () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)
      
      const result = validateAvailability(startDate, endDate)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'startDate')).toBe(true)
    })

    it('should fail when end date is before start date', () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 30)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)
      
      const result = validateAvailability(startDate, endDate)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'endDate')).toBe(true)
    })

    it('should warn for short availability window', () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 4)
      
      const result = validateAvailability(startDate, endDate)
      expect(result.warnings.some(w => w.field === 'endDate')).toBe(true)
    })

    it('should warn for far future availability', () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 400)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 430)
      
      const result = validateAvailability(startDate, endDate)
      expect(result.warnings.some(w => w.field === 'startDate')).toBe(true)
    })
  })

  describe('validateCurrencyCountryMatch', () => {
    it('should pass for NZ with NZD', () => {
      const result = validateCurrencyCountryMatch('NZ', 'NZD')
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('should pass for AU with AUD', () => {
      const result = validateCurrencyCountryMatch('AU', 'AUD')
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('should warn for NZ with AUD', () => {
      const result = validateCurrencyCountryMatch('NZ', 'AUD')
      expect(result.valid).toBe(true) // Still valid, just a warning
      expect(result.warnings.some(w => w.field === 'currency')).toBe(true)
    })

    it('should warn for AU with NZD', () => {
      const result = validateCurrencyCountryMatch('AU', 'NZD')
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.field === 'currency')).toBe(true)
    })
  })
})
