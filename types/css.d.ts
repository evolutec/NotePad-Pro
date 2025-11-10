declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '@/styles/globals.css';
declare module '@/components/ui/tree-styles.css';
