import { Box, Chip, TextField } from "@mui/material"
import { MenuContext } from "@renderer/context"
import { colors } from "@renderer/tagColor"
import { customSort, getValueIfStarts } from "@renderer/utils"
import { useContext, useEffect, useMemo, useState } from "react"


export const AllTagsPage = () => {

    const [allTags, setAllTags] = useState<string[]>([])
    const [search, setSearch] = useState("")
    const {onChangeMenu} = useContext(MenuContext)

    const load = async () => {
        setAllTags(customSort(await window.api.getAllTags(), colors))
    }

    const filteredTags = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        if (!normalizedSearch) return allTags

        return allTags.filter((tag) => tag.toLowerCase().includes(normalizedSearch))
    }, [allTags, search])

    const clickHandler = (name:string) => {
        onChangeMenu("withGroup", [name])
    }

    useEffect(()=>{
        load()
    },[load])

    return(
        <Box p={2} height="100vh" sx={{overflowY: "scroll"}}>
            <TextField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по тегам"
                size="small"
                fullWidth
                sx={{ mb: 2, maxWidth: 360 }}
            />
            <Box display="flex" gap="10px" flexWrap="wrap">
                {filteredTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    sx={{color: getValueIfStarts(colors, tag) as string, borderColor: getValueIfStarts(colors, tag) as string}}
                    onClick={() => clickHandler(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
            </Box>
        </Box>
    )
}