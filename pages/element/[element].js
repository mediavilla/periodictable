import { useRouter } from 'next/router'

export default function Element() {
    const router = useRouter()
    const { element } = router.query

    // Now you can use the `element` variable to fetch data for that element and render it.

    return <div>Element: {element}</div>
}
