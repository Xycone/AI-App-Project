import React, { useEffect, useState } from 'react';

import {
    Box,
    Typography,
    Grid,
    Divider,
    Button,
    Select,
    Checkbox,
    MenuItem,
    FormControl,
    Dialog,
    DialogContent,
    DialogContentText,
    IconButton,
    useTheme
} from '@mui/material'

import { tokens } from '../themes/MyTheme';

// MUI Icons
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

// Used for backend API call
import http from '../http';

// Form & Form Validation
import * as yup from 'yup';
import { useFormik } from 'formik';

// React Components
import Header from '../components/Header';

// Toast
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function TranscribeFiles() {
    const theme = useTheme();
    const colours = tokens(theme.palette.mode);

    // Device model is running on
    const [device, setDevice] = useState(null);
    useEffect(() => {
        http.get("/get-device").then((res) => {
            setDevice(res.data);
        });
    }, []);

    // File Selection
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);

    const handleDialogOpen = () => {
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        let exceededFiles = [];

        files.forEach((file) => {
            if (file.size <= 25 * 1024 * 1024) {
                setSelectedFiles((prevFiles) => [...prevFiles, file]);
            } else {
                exceededFiles.push(file.name);
            }
        });

        if (exceededFiles.length > 0) {
            toast.error(`Files exceeding the 25MB size limit: ${exceededFiles.join(', ')}`);
        }

        event.target.value = '';
    };

    const handleDrop = (event) => {
        event.preventDefault();

        const files = Array.from(event.dataTransfer.files);
        let exceededFiles = [];

        files.forEach((file) => {
            if (file.size <= 25 * 1024 * 1024) {
                setSelectedFiles((prevFiles) => [...prevFiles, file]);
            } else {
                exceededFiles.push(file.name);
            }
        });

        if (exceededFiles.length > 0) {
            toast.error(`Files exceeding the 25MB size limit: ${exceededFiles.join(', ')}`);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDeleteFile = (index) => {
        setSelectedFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles.splice(index, 1);
            return updatedFiles;
        });
    };

    // Form
    const [response, setResponse] = useState();
    const [loading, setLoading] = useState(false);

    const formik = useFormik({
        // Default Form Values
        initialValues: {
            asr_model: "small_sg",
            content_summary: true,
            llm: "mistral_7b"
        },

        // Validation Schema
        validationSchema: yup.object({
            asr_model: yup.string()
                .oneOf(["small", "small_sg", "medium"])
                .required(),

            content_summary: yup.bool()
                .required(),

            llm: yup.string()
                .oneOf(["mistral_7b", "llama_8b", "mistral_22b"])
                .required(),
        }),

        onSubmit: (data) => {
            data.asr_model = data.asr_model.trim();
            data.llm = data.llm.trim();

            const formData = new FormData();

            // Append files to formData
            for (const file of selectedFiles) {
                formData.append("files", file);
            }

            // Log form details
            console.log(`form submitted | asr_model: ${data.asr_model} | content_summary: ${data.content_summary} | llm: ${data.llm}`);

            setResponse();
            setLoading(true);

            // POST Request
            http.post("/transcribe-audio", formData, {
                params: {
                    asr_model: data.asr_model,
                    content_summary: data.content_summary,
                    llm: data.llm
                }
            })
                .then((res) => {
                    console.log("API Response:", res.data);
                    setResponse(res.data);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("API Error:", error);
                    setResponse(error.response);
                    setLoading(false);
                });
        }
    });

    // Copy response
    const handleDownload = () => {
        if (response) {
            const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'response.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <Box p={5}>
            <Box
                display="flex"
                flexDirection="column"
            >
                <Header
                    title="Transcribe Audio"
                    subtitle="[POST]: /transcribe-audio"
                />

                <Box
                    component="form"
                    m={4}
                >
                    <Box mb={10}>
                        {/* General Information */}
                        <Grid container my={2}>
                            <Grid item xs={12} md={4} lg={2.5}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    height="100%"
                                >
                                    <Typography variant="h6">Device Type:</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={8} lg={9.5}>
                                <Typography>
                                    {device ? (
                                        device
                                    ) : (
                                        "- N.A. -"
                                    )}
                                </Typography>
                            </Grid>
                        </Grid>

                        <Divider />

                        <Grid container my={2}>
                            <Grid item xs={12} md={4} lg={2.5}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    height="100%"
                                >
                                    <Typography variant="h6">File Format:</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={8} lg={9.5}>
                                <Typography>mp3, mp4, mpeg, mpga, m4a, wav, webm</Typography>
                            </Grid>
                        </Grid>

                        <Divider />

                        <Grid container my={2}>
                            <Grid item xs={12} md={4} lg={2.5}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    height="100%"
                                >
                                    <Typography>File Size Limit (MB):</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={8} lg={9.5}>
                                <Typography>25</Typography>
                            </Grid>
                        </Grid>

                        <Divider />


                        {/* Select Files */}
                        <Grid container my={2}>
                            <Grid item xs={12} md={4} lg={2.5}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    height="100%"
                                >
                                    <Typography>Files Selected:</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={8} lg={9.5}>
                                <Box>
                                    <Typography
                                        display="inline"
                                        onClick={handleDialogOpen}
                                        sx={{
                                            textDecoration: "underline",
                                            cursor: "pointer",
                                            "&:hover": {
                                                color: colours.greenAccent[300],
                                            }
                                        }}

                                    >
                                        Manage Files
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        <Divider />
                        {/* ASR Model */}
                        <Grid container my={2}>
                            <Grid item xs={12} md={4} lg={2.5}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    height="100%"
                                >
                                    <Typography>ASR Model:</Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={8} lg={9.5}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    height="100%"
                                >
                                    <Select
                                        autoWidth
                                        size="small"
                                        name="asr_model"
                                        value={formik.values.asr_model}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={formik.touched.asr_model && Boolean(formik.errors.asr_model)}
                                    >
                                        <MenuItem value={"small"}>Whisper Small</MenuItem>
                                        <MenuItem value={"small_sg"}>Whisper Small (SG-finetune)</MenuItem>
                                        <MenuItem value={"medium"}>Whisper Medium</MenuItem>
                                    </Select>
                                </Box>
                            </Grid>
                        </Grid>

                        <Divider />

                        {/* Transcript Audit */}
                        <Grid container my={2}>
                            <Grid item xs={12} md={4} lg={2.5}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    height="100%"
                                >
                                    <Typography>Generate Summary:</Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={8} lg={9.5}>
                                <FormControl error={formik.touched.content_summary && Boolean(formik.errors.content_summary)}>
                                    <Checkbox
                                        name="content_summary"
                                        checked={formik.values.content_summary}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                </FormControl>
                            </Grid>
                        </Grid>

                        {formik.values.content_summary && (
                            <Box>
                                {/* Audit Criteria */}
                                <Grid container my={2}>
                                    <Grid item xs={12} md={4} lg={2.5}>
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            height="100%"
                                        >
                                            <Typography>LLM:</Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} md={8} lg={9.5}>
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            height="100%"
                                        >
                                            <Select
                                                autoWidth
                                                size="small"
                                                name="llm"
                                                value={formik.values.llm}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                error={formik.touched.llm && Boolean(formik.errors.llm)}
                                            >
                                                <MenuItem value={"mistral_7b"}>Mistral 7B Instruct</MenuItem>
                                                <MenuItem value={"llama_8b"}>Llama 3.1 8B Instruct</MenuItem>
                                                <MenuItem value={"mistral_22b"}>Mistral 22B Instruct</MenuItem>
                                            </Select>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        <Divider />


                        <Box
                            display="flex"
                            justifyContent="end"
                            my={3}
                        >
                            <Button
                                variant="contained"
                                type="submit"
                                component="label"
                                size="large"
                                onClick={formik.handleSubmit}
                                disabled={!selectedFiles.length}
                            >
                                Submit
                            </Button>
                        </Box>
                    </Box>


                    {/* JSON Response */}
                    <Box>
                        <Box
                            display="flex"
                            alignItems="center"
                            borderRadius="5px"
                        >
                            <Typography my={2}>API Response:</Typography>

                            <Box style={{ flexGrow: 1 }} />

                            <Box>
                                <IconButton onClick={handleDownload}>
                                    <FileDownloadOutlinedIcon />
                                </IconButton>
                            </Box>
                        </Box>

                        <Divider />

                        <Box
                            my={2}
                        >
                            <Box
                                p={5}
                                mb={4}
                                minHeight="60vh"
                                maxHeight="60vh"
                                backgroundColor={colours.primary[400]}
                                borderRadius="5px"
                                style={{ overflow: "auto" }}
                            >
                                {loading && (
                                    <Typography>
                                        Loading, Please Do Not Refresh The Page...
                                    </Typography>
                                )}

                                {response instanceof Error ? (
                                    <Typography>
                                        {response.message}
                                    </Typography>
                                ) : (
                                    <Box>
                                        <Typography component="pre">
                                            {JSON.stringify(response, null, 2)}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>

                </Box>
            </Box>


            {/* File Select Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                fullWidth
                maxWidth="sm"
            >
                <DialogContent>
                    <Box p={1}>
                        <Box
                            mb={2}
                            display="flex"
                            alignItems="start"
                            justifyContent="space-between"
                        >
                            <Box>
                                <Typography variant="h5">
                                    Upload Files
                                </Typography>
                                <DialogContentText>
                                    Upload & Attach Audio Files To The API Request.
                                </DialogContentText>
                            </Box>

                            <IconButton onClick={handleDialogClose}>
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        <Box>
                            <Typography>{selectedFiles.length} file(s) selected</Typography>

                            {/* File Dropzone */}
                            <Box
                                p={5}
                                minWidth="fit-content"
                                border="2px dashed"
                                borderRadius="5px"
                                textAlign="center"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                style={{
                                    backgroundColor: "inherit",
                                    background: "repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 20px, rgba(255, 255, 255, 0.05) 20px, rgba(255, 255, 255, 0.05) 40px)"
                                }}
                            >
                                <Typography mb={2}>
                                    Choose a file or drag & drop it here
                                </Typography>
                                <DialogContentText mb={2}>
                                    mp3, mpeg, m4a & wav formats, up to 25MB
                                </DialogContentText>
                                <Button
                                    variant="contained"
                                    component="label"
                                >
                                    <Typography>Browse</Typography>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".mp3,.mpeg,.m4a,.wav"
                                        style={{ display: 'none' }}
                                        onChange={handleFileSelect}
                                    />
                                </Button>
                            </Box>
                        </Box>


                        {/* Uploaded File Viewer */}
                        {selectedFiles.map((file, index) => (
                            <Box mt={5} key={index}>
                                <Box
                                    my={1}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Box>
                                        <Typography>{file.name}</Typography>
                                        <DialogContentText>
                                            {file.size < 1024 * 1024
                                                ? `${(file.size / 1024).toFixed(0)} KB`
                                                : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                                        </DialogContentText>
                                    </Box>

                                    <IconButton onClick={() => handleDeleteFile(index)}>
                                        <DeleteOutlinedIcon />
                                    </IconButton>
                                </Box>

                                <Divider />
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Toast */}
            <ToastContainer />
        </Box >
    )
}

export default TranscribeFiles