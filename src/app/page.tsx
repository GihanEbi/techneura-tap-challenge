'use client'
import React from 'react'
import { useRouter } from 'next/navigation'

const page = () => {
  // redirect to register page
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/register');
  }, [router]);
  return (
    <div>Redirect..</div>
  )
}

export default page