import { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Avatar,
  Box
} from "@mui/material";
import { Preview } from "./Prev";


export default function GroupsTable() {
  const [sequences, setSequences] = useState<Record<string, string[]>>({});

  useEffect(() => {
    window.api.getGroups().then(res=>{
        setSequences(res)
    })
  }, []);

  return (
    <Box sx={{ width: "100vw"}}>
        <TableContainer component={Paper} sx={{width: "100%"}}>
        <Table>
            <TableHead>
            <TableRow>
                <TableCell>Превью</TableCell>
                <TableCell>Название группы</TableCell>
                <TableCell>Количество изображений</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {Object.entries(sequences).map(([name, images]) => (
                <TableRow key={name} hover>
                <TableCell>
                    {images.length > 0 ? (
                    <Preview name={images[0]}/>
                    ) : (
                    <Avatar variant="square" sx={{ width: 64, height: 64 }}>
                        ?
                    </Avatar>
                    )}
                </TableCell>
                <TableCell>{name}</TableCell>
                <TableCell>{images.length}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </TableContainer>
    </Box>
  );
}
