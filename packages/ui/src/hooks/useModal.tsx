'use client'

import { useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import { type Json } from '@indexnow/shared'

interface ModalState {
  isOpen: boolean
  title?: string
  content?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  type?: 'default' | 'success' | 'warning' | 'error' | 'info'
  showClose?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  persistent?: boolean
  data?: Json
}

interface ModalActions {
  onConfirm?: (data?: Json) => void | Promise<void>
  onCancel?: () => void
  onClose?: () => void
  confirmText?: string
  cancelText?: string
  confirmLoading?: boolean
}

interface UseModalReturn {
  // State
  modal: ModalState
  isOpen: boolean
  
  // Actions
  openModal: (config: Partial<ModalState & ModalActions>) => void
  closeModal: () => void
  updateModal: (updates: Partial<ModalState>) => void
  
  // Confirmation modal specific
  openConfirmModal: (config: {
    title: string
    message: string
    onConfirm: () => void | Promise<void>
    onCancel?: () => void
    confirmText?: string
    cancelText?: string
    type?: ModalState['type']
  }) => void
  
  // Loading modal specific
  openLoadingModal: (config: {
    title?: string
    message?: string
  }) => void
  
  // Success/Error modal specific
  openResultModal: (config: {
    type: 'success' | 'error'
    title: string
    message: string
    onClose?: () => void
  }) => void
}

export function useModal(): UseModalReturn {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    size: 'md',
    type: 'default',
    showClose: true,
    closeOnOverlay: true,
    closeOnEscape: true,
    persistent: false
  })
  
  const [modalActions, setModalActions] = useState<ModalActions>({})
  
  // Open modal with configuration
  const openModal = useCallback((config: Partial<ModalState & ModalActions>) => {
    const { onConfirm, onCancel, onClose, confirmText, cancelText, confirmLoading, ...modalConfig } = config
    
    setModal(prev => ({
      ...prev,
      ...modalConfig,
      isOpen: true
    }))
    
    setModalActions({
      onConfirm,
      onCancel,
      onClose,
      confirmText,
      cancelText,
      confirmLoading
    })
  }, [])

  // Close modal
  const closeModal = useCallback(() => {
    setModal(prev => ({
      ...prev,
      isOpen: false
    }))
    
    // Call onClose callback if provided
    if (modalActions.onClose) {
      modalActions.onClose()
    }
    
    // Clear actions
    setModalActions({})
  }, [modalActions.onClose])

  // Update modal state
  const updateModal = useCallback((updates: Partial<ModalState>) => {
    setModal(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  // Open confirmation modal
  const openConfirmModal = useCallback((config: {
    title: string
    message: string
    onConfirm: () => void | Promise<void>
    onCancel?: () => void
    confirmText?: string
    cancelText?: string
    type?: ModalState['type']
  }) => {
    // Note: In a real implementation, the content would be rendered by a Modal component
    // that uses this state. For now, we're keeping the hook logic.
    openModal({
      title: config.title,
      type: config.type || 'default',
      size: 'md',
      showClose: false,
      closeOnOverlay: false,
      closeOnEscape: true,
      onConfirm: config.onConfirm,
      onCancel: config.onCancel,
      confirmText: config.confirmText,
      cancelText: config.cancelText
    })
  }, [openModal])

  // Open loading modal
  const openLoadingModal = useCallback((config: {
    title?: string
    message?: string
  }) => {
    openModal({
      title: config.title || 'Loading...',
      size: 'sm',
      showClose: false,
      closeOnOverlay: false,
      closeOnEscape: false,
      persistent: true
    })
  }, [openModal])

  // Open success/error result modal
  const openResultModal = useCallback((config: {
    type: 'success' | 'error'
    title: string
    message: string
    onClose?: () => void
  }) => {
    openModal({
      title: config.title,
      type: config.type,
      size: 'sm',
      showClose: false,
      closeOnOverlay: true,
      closeOnEscape: true,
      onClose: config.onClose
    })
  }, [openModal])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modal.isOpen && modal.closeOnEscape && !modal.persistent) {
        closeModal()
      }
    }

    if (modal.isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [modal.isOpen, modal.closeOnEscape, modal.persistent, closeModal])

  return {
    modal: {
      ...modal,
      ...modalActions
    },
    isOpen: modal.isOpen,
    openModal,
    closeModal,
    updateModal,
    openConfirmModal,
    openLoadingModal,
    openResultModal
  }
}
