
           <div class="box-header with-border">
               <h2 align="center" font-weight=" bold">Müşteri Ekleme Formu</h2>
            </div>
            <!-- /.box-header -->
            <!-- form start -->
            <form role="form" action="<?=base_url()?>admin/kullanicilarEkle/kaydet" method="post">
              <div class="box-body">
				<div class="form-group">
                  <label for="exampleInputEmail1">Adı Soyadı:</label>
                  <input type="text"  name="adiSoyadi" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputEmail1">Email Adres:</label>
                  <input type="email" name="email" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputPassword1">Şifre:</label>
                  <input type="password" name="sifre" class="form-control" id="exampleInputPassword1">
                </div>
				
                <div class="form-group">
                  <label>Yetkisi:</label>
                  <select class="form-control" name ="yetki">
                    <option>admin</option>
                    <option>editör</option>
                    <option>satış personeli</option>
                  </select>
                </div>
				<div class="form-group">
                  <label>Durumu:</label>
                  <select class="form-control" name="durum">
                    <option>Pasif</option>
                    <option>Beklemede</option>
                    <option>Aktif</option>
                    
                    
					</select>
                </div>
				<div class="form-group">
                
            <div><strong>Resim Seçin:</strong> <input type="file" name="resim" /></div>
            
                </div>
              </div>
              <!-- /.box-body -->

              
                <button type="submit" class="btn btn-primary">Ekle</button>
             
            </form>
    
  
