import './App.css';
import ContactList from './components/contactList';

function App() {
  return (
    <div className="App">
      {/* call the ContactList component to display al the conatcts from the data/conatcts.json file */}
      <ContactList />
    </div>
  );
}

export default App;
