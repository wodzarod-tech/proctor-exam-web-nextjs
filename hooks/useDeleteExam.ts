// Client logic

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteExam } from "@/lib/actions/exam.actions"

export function useDeleteExam(user: any)  {
  const router = useRouter()

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleOpenDelete = () => {
    if (!user) {
      router.push("/login")
      return
    }

    setIsDeleteOpen(true)
  }

  const handleDelete = async (id: string) => {
    console.log("id=", id);
    
    try {
      setDeleting(true)
      await deleteExam(id)
      router.push("/")
      //router.refresh() // refresh page after remove card
    } catch (error) {
      console.error("Failed to delete exam:", error)
      //setMsg("❌ Failed to delete exam")
    } finally {
      setDeleting(false)
    }
  }

  return {
    isDeleteOpen,
    openDelete: handleOpenDelete, // for opening
    closeDelete: () => setIsDeleteOpen(false), // for closing
    deleting,
    handleDelete
  }
}