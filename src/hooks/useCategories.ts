import { useEffect, useState } from 'react'
import { supabase, type Category } from '../lib/supabase'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (error) {
        setError(error.message)
      } else {
        setCategories(data as Category[])
      }
      setLoading(false)
    }
    fetchCategories()
  }, [])

  return { categories, loading, error, setCategories }
}
