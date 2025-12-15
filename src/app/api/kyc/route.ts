/**
 * KYC Document Upload API
 * 
 * Endpoints for submitting and checking KYC documents.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  submitDocument,
  getKYCStatus,
  validateFileMetadata,
} from '@/lib/kyc'

// GET /api/kyc - Get KYC status for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const status = await getKYCStatus(userId)

    if (!status) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Get KYC status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KYC status' },
      { status: 500 }
    )
  }
}

// POST /api/kyc - Submit a document for verification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()

    const {
      documentType,
      documentNumber,
      documentExpiry,
      fileUrl,
      additionalUrls,
      listingId,
      // File metadata for validation
      mimeType,
      fileSize,
    } = body

    // Validate required fields
    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      )
    }

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      )
    }

    // Validate file metadata if provided
    if (mimeType && fileSize) {
      const fileValidation = validateFileMetadata(mimeType, fileSize)
      if (!fileValidation.valid) {
        return NextResponse.json(
          { error: fileValidation.error },
          { status: 400 }
        )
      }
    }

    // Submit document
    const result = await submitDocument({
      userId,
      documentType,
      documentNumber,
      documentExpiry: documentExpiry ? new Date(documentExpiry) : undefined,
      fileUrl,
      additionalUrls,
      listingId,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit document' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      verificationRequestId: result.verificationRequestId,
      message: 'Document submitted for verification',
    })
  } catch (error) {
    console.error('Submit KYC document error:', error)
    return NextResponse.json(
      { error: 'Failed to submit document' },
      { status: 500 }
    )
  }
}
