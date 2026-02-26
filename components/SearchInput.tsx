'use client' // for use{} , for example: usePathname

import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {useEffect, useState} from 'react'
import Image from 'next/image';
import {formUrlQuery, removeKeysFromUrlQuery} from '@jsmastery/utils';
             // use{} -> hooks

const SearchInput = () => {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get('title') || '';

    const [searchQuery, setSearchQuery] = useState(query);

    // modify URL bar based on what we typing in the search input
    // what we typing is querying to the the database
    // http://localhost:3000/?title=APX
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if(searchQuery) {
                const newUrl = formUrlQuery({
                    params: searchParams.toString(),
                    key: "title",
                    value: searchQuery,
                });

                router.push(newUrl, { scroll: false });
            } else {
                const newUrl = removeKeysFromUrlQuery({
                    params: searchParams.toString(),
                    keysToRemove: ["title"],
                });

                router.push(newUrl, { scroll: false });
            }
        }, 500);
        
        return () => clearTimeout(delayDebounceFn); // debounce cleanup
    }, [searchQuery, router, searchParams, pathname]);

    return (
    <div className="w-full">
        <div className="flex items-center gap-3 px-6 py-5 rounded-full border border-gray-200 shadow-md bg-white focus-within:shadow-lg transition-all">
        
        <Image
            src="/icons/search.svg"
            alt="search"
            width={20}
            height={20}
            className="opacity-60"
        />

        <input
            type="text"
            placeholder="Search exams..."
            className="flex-1 text-lg outline-none bg-transparent placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
        </div>
    </div>
    );
}
export default SearchInput