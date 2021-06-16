type FileSystemName = string;
export type FileContent = string;

/**
 * Represents a directory of project files.
 * Directory has a number of children, each with a distinct name.
 * Directory children are either another Directory or a FileContent.
 * @todo Allow children to include subdirectories
 */
export type Directory = Record<FileSystemName, FileContent>

export type ExampleProject = {
    name: string;
    directory: Directory
}
