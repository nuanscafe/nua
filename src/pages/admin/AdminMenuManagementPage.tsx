import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { MenuItem, Category } from '../../data/menuData';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Toaster } from '../../components/ui/toaster';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';


const AdminMenuManagementPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newItem, setNewItem] = useState({
    name_tr: '', name_en: '', name_ru: '', name_de: '', name_fr: '',
    description_tr: '', description_en: '', description_ru: '', description_de: '', description_fr: '',
    price: '', image: '', category: ''
  });
  const [newCategory, setNewCategory] = useState({
    name_tr: '', name_en: '', name_ru: '', name_de: '', name_fr: ''
  });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editedItem, setEditedItem] = useState({
    name_tr: '', name_en: '', name_ru: '', name_de: '', name_fr: '',
    description_tr: '', description_en: '', description_ru: '', description_de: '', description_fr: '',
    price: '', image: '', category: ''
  });
  const [editedCategory, setEditedCategory] = useState({
    name_tr: '', name_en: '', name_ru: '', name_de: '', name_fr: ''
  });
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const fetchMenuData = async () => {
    try {
      const menuItemsCollection = collection(db, 'menuItems');
      const menuItemsSnapshot = await getDocs(menuItemsCollection);
      const menuItemsList = menuItemsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name_tr: data.name_tr || '',
          name_en: data.name_en || '',
          name_ru: data.name_ru || '',
          name_de: data.name_de || '',
          name_fr: data.name_fr || '',
          description_tr: data.description_tr || '',
          description_en: data.description_en || '',
          description_ru: data.description_ru || '',
          description_de: data.description_de || '',
          description_fr: data.description_fr || '',
          price: data.price || 0,
          image: data.image || '',
          category: data.category || '',
        } as MenuItem;
      });
      setMenuItems(menuItemsList);

      const categoriesCollection = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCollection);
      const categoriesList = categoriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name_tr: data.name_tr || '',
          name_en: data.name_en || '',
          name_ru: data.name_ru || '',
          name_de: data.name_de || '',
          name_fr: data.name_fr || '',
        } as Category;
      });
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast({
        title: t('error'),
        description: t('errorFetchingMenuData'),
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleAddMenuItem = async () => {
    try {
      if (!newItem.name_tr || !newItem.price || !newItem.category) {
        toast({
          title: t('warning'),
          description: t('pleaseFillNamePriceCategory'),
          variant: 'destructive',
        });
        return;
      }

      await addDoc(collection(db, 'menuItems'), {
        name_tr: newItem.name_tr,
        name_en: newItem.name_en,
        name_ru: newItem.name_ru,
        name_de: newItem.name_de,
        name_fr: newItem.name_fr,
        description_tr: newItem.description_tr,
        description_en: newItem.description_en,
        description_ru: newItem.description_ru,
        description_de: newItem.description_de,
        description_fr: newItem.description_fr,
        price: parseFloat(newItem.price),
        image: newItem.image,
        category: newItem.category,
      });

      setNewItem({
        name_tr: '', name_en: '', name_ru: '', name_de: '', name_fr: '',
        description_tr: '', description_en: '', description_ru: '', description_de: '', description_fr: '',
        price: '', image: '', category: ''
      });
      await fetchMenuData();
      toast({
        title: t('success'),
        description: t('itemAddedSuccessfully'),
      });
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast({
        title: t('error'),
        description: t('errorAddingMenuItem'),
        variant: 'destructive',
      });
    }
  };

  const handleAddCategory = async () => {
    try {
      if (!newCategory.name_tr) {
        toast({
          title: t('warning'),
          description: t('pleaseFillCategoryName'),
          variant: 'destructive',
        });
        return;
      }

      await addDoc(collection(db, 'categories'), {
        name_tr: newCategory.name_tr,
        name_en: newCategory.name_en,
        name_ru: newCategory.name_ru,
        name_de: newCategory.name_de,
        name_fr: newCategory.name_fr,
      });

      setNewCategory({
        name_tr: '', name_en: '', name_ru: '', name_de: '', name_fr: ''
      });
      await fetchMenuData();
      toast({
        title: t('success'),
        description: t('categoryAddedSuccessfully'),
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: t('error'),
        description: t('errorAddingCategory'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'menuItems', itemId));
      await fetchMenuData();
      toast({
        title: t('success'),
        description: t('itemDeletedSuccessfully'),
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: t('error'),
        description: t('errorDeletingMenuItem'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      await fetchMenuData();
      toast({
        title: t('success'),
        description: t('categoryDeletedSuccessfully'),
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: t('error'),
        description: t('errorDeletingCategory'),
        variant: 'destructive',
      });
    }
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingItem(item);
    setEditedItem({
      name_tr: item.name_tr,
      name_en: item.name_en || '',
      name_ru: item.name_ru || '',
      name_de: item.name_de || '',
      name_fr: item.name_fr || '',
      description_tr: item.description_tr,
      description_en: item.description_en || '',
      description_ru: item.description_ru || '',
      description_de: item.description_de || '',
      description_fr: item.description_fr || '',
      price: item.price.toString(),
      image: item.image,
      category: item.category,
    });
  };

  const handleUpdateMenuItem = async () => {
    if (!editingItem) return;
    try {
      if (!editedItem.name_tr || !editedItem.price || !editedItem.category) {
        toast({
          title: t('warning'),
          description: t('pleaseFillNamePriceCategory'),
          variant: 'destructive',
        });
        return;
      }

      const itemRef = doc(db, 'menuItems', editingItem.id);
      await updateDoc(itemRef, {
        name_tr: editedItem.name_tr,
        name_en: editedItem.name_en,
        name_ru: editedItem.name_ru,
        name_de: editedItem.name_de,
        name_fr: editedItem.name_fr,
        description_tr: editedItem.description_tr,
        description_en: editedItem.description_en,
        description_ru: editedItem.description_ru,
        description_de: editedItem.description_de,
        description_fr: editedItem.description_fr,
        price: parseFloat(editedItem.price),
        image: editedItem.image,
        category: editedItem.category,
      });

      setEditingItem(null);
      setEditedItem({
        name_tr: '', name_en: '', name_ru: '', name_de: '', name_fr: '',
        description_tr: '', description_en: '', description_ru: '', description_de: '', description_fr: '',
        price: '', image: '', category: ''
      });
      await fetchMenuData();
      toast({
        title: t('success'),
        description: t('itemUpdatedSuccessfully'),
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast({
        title: t('error'),
        description: t('errorUpdatingMenuItem'),
        variant: 'destructive',
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditedCategory({
      name_tr: category.name_tr,
      name_en: category.name_en || '',
      name_ru: category.name_ru || '',
      name_de: category.name_de || '',
      name_fr: category.name_fr || '',
    });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    try {
      if (!editedCategory.name_tr) {
        toast({
          title: t('warning'),
          description: t('pleaseFillCategoryName'),
          variant: 'destructive',
        });
        return;
      }

      const categoryRef = doc(db, 'categories', editingCategory.id);
      await updateDoc(categoryRef, {
        name_tr: editedCategory.name_tr,
        name_en: editedCategory.name_en,
        name_ru: editedCategory.name_ru,
        name_de: editedCategory.name_de,
        name_fr: editedCategory.name_fr,
      });

      setEditingCategory(null);
      setEditedCategory({
        name_tr: '', name_en: '', name_ru: '', name_de: '', name_fr: ''
      });
      await fetchMenuData();
      toast({
        title: t('success'),
        description: t('categoryUpdatedSuccessfully'),
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: t('error'),
        description: t('errorUpdatingCategory'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t('menuManagement')}</h1>

      <Tabs defaultValue="menuItems" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="menuItems">{t('menuItems')}</TabsTrigger>
          <TabsTrigger value="categories">{t('categories')}</TabsTrigger>
        </TabsList>

        <TabsContent value="menuItems">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{t('addNewMenuItem')}</CardTitle>
              <CardDescription>{t('addNewMenuItemDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newItemNameTr">{t('name')} (TR)</Label>
                  <Input
                    id="newItemNameTr"
                    type="text"
                    value={newItem.name_tr}
                    onChange={(e) => setNewItem({ ...newItem, name_tr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemNameEn">{t('name')} (EN)</Label>
                  <Input
                    id="newItemNameEn"
                    type="text"
                    value={newItem.name_en}
                    onChange={(e) => setNewItem({ ...newItem, name_en: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemNameRu">{t('name')} (RU)</Label>
                  <Input
                    id="newItemNameRu"
                    type="text"
                    value={newItem.name_ru}
                    onChange={(e) => setNewItem({ ...newItem, name_ru: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemNameDe">{t('name')} (DE)</Label>
                  <Input
                    id="newItemNameDe"
                    type="text"
                    value={newItem.name_de}
                    onChange={(e) => setNewItem({ ...newItem, name_de: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemNameFr">{t('name')} (FR)</Label>
                  <Input
                    id="newItemNameFr"
                    type="text"
                    value={newItem.name_fr}
                    onChange={(e) => setNewItem({ ...newItem, name_fr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemDescriptionTr">{t('description')} (TR)</Label>
                  <Textarea
                    id="newItemDescriptionTr"
                    value={newItem.description_tr}
                    onChange={(e) => setNewItem({ ...newItem, description_tr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemDescriptionEn">{t('description')} (EN)</Label>
                  <Textarea
                    id="newItemDescriptionEn"
                    value={newItem.description_en}
                    onChange={(e) => setNewItem({ ...newItem, description_en: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemDescriptionRu">{t('description')} (RU)</Label>
                  <Textarea
                    id="newItemDescriptionRu"
                    value={newItem.description_ru}
                    onChange={(e) => setNewItem({ ...newItem, description_ru: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemDescriptionDe">{t('description')} (DE)</Label>
                  <Textarea
                    id="newItemDescriptionDe"
                    value={newItem.description_de}
                    onChange={(e) => setNewItem({ ...newItem, description_de: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemDescriptionFr">{t('description')} (FR)</Label>
                  <Textarea
                    id="newItemDescriptionFr"
                    value={newItem.description_fr}
                    onChange={(e) => setNewItem({ ...newItem, description_fr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemPrice">{t('price')}</Label>
                  <Input
                    id="newItemPrice"
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemImage">{t('imageUrl')}</Label>
                  <Input
                    id="newItemImage"
                    type="text"
                    value={newItem.image}
                    onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newItemCategory">{t('category')}</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger id="newItemCategory">
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>{category[`name_${i18n.language}`] || category.name_tr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddMenuItem} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> {t('addItem')}
              </Button>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card>
            <CardHeader>
              <CardTitle>{t('existingMenuItems')}</CardTitle>
              <CardDescription>{t('existingMenuItemsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('description')}</TableHead>
                    <TableHead>{t('price')}</TableHead>
                    <TableHead>{t('category')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item[('name_' + i18n.language) as keyof MenuItem] || item.name_tr}</TableCell>
                      <TableCell>{item[('description_' + i18n.language) as keyof MenuItem] || item.description_tr}</TableCell>
                      <TableCell>{item.price} ₺</TableCell>
                      <TableCell>{categories.find(cat => cat.id === item.category)?.[('name_' + i18n.language) as keyof Category] || categories.find(cat => cat.id === item.category)?.name_tr || 'Bilinmiyor'}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleEditMenuItem(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{t('editMenuItem')}</DialogTitle>
                              <DialogDescription>
                                {t('updateMenuItemInfo')}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="editedItemNameTr">{t('name')} (TR)</Label>
                                <Input
                                  id="editedItemNameTr"
                                  value={editedItem.name_tr}
                                  onChange={(e) => setEditedItem({ ...editedItem, name_tr: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemNameEn">{t('name')} (EN)</Label>
                                <Input
                                  id="editedItemNameEn"
                                  value={editedItem.name_en}
                                  onChange={(e) => setEditedItem({ ...editedItem, name_en: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemNameRu">{t('name')} (RU)</Label>
                                <Input
                                  id="editedItemNameRu"
                                  value={editedItem.name_ru}
                                  onChange={(e) => setEditedItem({ ...editedItem, name_ru: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemNameDe">{t('name')} (DE)</Label>
                                <Input
                                  id="editedItemNameDe"
                                  value={editedItem.name_de}
                                  onChange={(e) => setEditedItem({ ...editedItem, name_de: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemNameFr">{t('name')} (FR)</Label>
                                <Input
                                  id="editedItemNameFr"
                                  value={editedItem.name_fr}
                                  onChange={(e) => setEditedItem({ ...editedItem, name_fr: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemDescriptionTr">{t('description')} (TR)</Label>
                                <Textarea
                                  id="editedItemDescriptionTr"
                                  value={editedItem.description_tr}
                                  onChange={(e) => setEditedItem({ ...editedItem, description_tr: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemDescriptionEn">{t('description')} (EN)</Label>
                                <Textarea
                                  id="editedItemDescriptionEn"
                                  value={editedItem.description_en}
                                  onChange={(e) => setEditedItem({ ...editedItem, description_en: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemDescriptionRu">{t('description')} (RU)</Label>
                                <Textarea
                                  id="editedItemDescriptionRu"
                                  value={editedItem.description_ru}
                                  onChange={(e) => setEditedItem({ ...editedItem, description_ru: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemDescriptionDe">{t('description')} (DE)</Label>
                                <Textarea
                                  id="editedItemDescriptionDe"
                                  value={editedItem.description_de}
                                  onChange={(e) => setEditedItem({ ...editedItem, description_de: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemDescriptionFr">{t('description')} (FR)</Label>
                                <Textarea
                                  id="editedItemDescriptionFr"
                                  value={editedItem.description_fr}
                                  onChange={(e) => setEditedItem({ ...editedItem, description_fr: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemPrice">{t('price')}</Label>
                                <Input
                                  id="editedItemPrice"
                                  type="number"
                                  value={editedItem.price}
                                  onChange={(e) => setEditedItem({ ...editedItem, price: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemImage">{t('imageUrl')}</Label>
                                <Input
                                  id="editedItemImage"
                                  value={editedItem.image}
                                  onChange={(e) => setEditedItem({ ...editedItem, image: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedItemCategory">{t('category')}</Label>
                                <Select
                                  value={editedItem.category}
                                  onValueChange={(value) => setEditedItem({ ...editedItem, category: value })}
                                >
                                  <SelectTrigger id="editedItemCategory">
                                    <SelectValue placeholder={t('selectCategory')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map(category => (
                                      <SelectItem key={category.id} value={category.id}>{category[`name_${i18n.language}`] || category.name_tr}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" onClick={handleUpdateMenuItem}>{t('save')}</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('confirmDeleteItem')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMenuItem(item.id)}>{t('delete')}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{t('addNewCategory')}</CardTitle>
              <CardDescription>{t('addNewCategoryDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newCategoryNameTr">{t('categoryName')} (TR)</Label>
                <Input
                  id="newCategoryNameTr"
                  type="text"
                  value={newCategory.name_tr}
                  onChange={(e) => setNewCategory({ ...newCategory, name_tr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newCategoryNameEn">{t('categoryName')} (EN)</Label>
                <Input
                  id="newCategoryNameEn"
                  type="text"
                  value={newCategory.name_en}
                  onChange={(e) => setNewCategory({ ...newCategory, name_en: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newCategoryNameRu">{t('categoryName')} (RU)</Label>
                <Input
                  id="newCategoryNameRu"
                  type="text"
                  value={newCategory.name_ru}
                  onChange={(e) => setNewCategory({ ...newCategory, name_ru: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newCategoryNameDe">{t('categoryName')} (DE)</Label>
                <Input
                  id="newCategoryNameDe"
                  type="text"
                  value={newCategory.name_de}
                  onChange={(e) => setNewCategory({ ...newCategory, name_de: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newCategoryNameFr">{t('categoryName')} (FR)</Label>
                <Input
                  id="newCategoryNameFr"
                  type="text"
                  value={newCategory.name_fr}
                  onChange={(e) => setNewCategory({ ...newCategory, name_fr: e.target.value })}
                />
              </div>
              <Button onClick={handleAddCategory} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> {t('addCategory')}
              </Button>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card>
            <CardHeader>
              <CardTitle>{t('existingCategories')}</CardTitle>
              <CardDescription>{t('existingCategoriesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('categoryName')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category[('name_' + i18n.language) as keyof Category] || category.name_tr}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px] max-h-[70vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{t('editCategory')}</DialogTitle>
                              <DialogDescription>
                                {t('updateCategoryName')}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="editedCategoryNameTr">{t('categoryName')} (TR)</Label>
                                <Input
                                  id="editedCategoryNameTr"
                                  value={editedCategory.name_tr}
                                  onChange={(e) => setEditedCategory({ ...editedCategory, name_tr: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedCategoryNameEn">{t('categoryName')} (EN)</Label>
                                <Input
                                  id="editedCategoryNameEn"
                                  value={editedCategory.name_en}
                                  onChange={(e) => setEditedCategory({ ...editedCategory, name_en: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedCategoryNameRu">{t('categoryName')} (RU)</Label>
                                <Input
                                  id="editedCategoryNameRu"
                                  value={editedCategory.name_ru}
                                  onChange={(e) => setEditedCategory({ ...editedCategory, name_ru: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedCategoryNameDe">{t('categoryName')} (DE)</Label>
                                <Input
                                  id="editedCategoryNameDe"
                                  value={editedCategory.name_de}
                                  onChange={(e) => setEditedCategory({ ...editedCategory, name_de: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editedCategoryNameFr">{t('categoryName')} (FR)</Label>
                                <Input
                                  id="editedCategoryNameFr"
                                  value={editedCategory.name_fr}
                                  onChange={(e) => setEditedCategory({ ...editedCategory, name_fr: e.target.value })}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" onClick={handleUpdateCategory}>{t('save')}</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('confirmDeleteCategory')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>{t('delete')}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default AdminMenuManagementPage;
