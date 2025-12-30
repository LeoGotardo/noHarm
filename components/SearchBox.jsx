const SearchBox = ({ placeholder, value, onChange }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base mb-5 focus:outline-none focus:border-blue-500"
  />
);

export default SearchBox;