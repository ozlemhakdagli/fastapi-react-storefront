



            <div class="box-header with-border">
              <h2 align="center" font-weight=" bold">Bilgileri Düzenleme Formu</h2><br>
            </div>
            <!-- /.box-header -->
            <!-- form start -->
            <form role="form" action="<?=base_url()?>admin/home/bilgileri_guncelle/<?=$veri[0]->Id?>" method="post">
              <div class="box-body">
				<div class="form-group">
                  <label for="exampleInputEmail1">Adı: </label>
                  <input type="text"  name="adi" value="<?=$veri[0]->adi?>" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputEmail1">Keywords:</label>
                  <input type="text" name="keywords" value="<?=$veri[0]->keywords?>" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputPassword1">Açıklama:</label>
                  <input type="text" name="aciklama" value="<?=$veri[0]->aciklama?>" class="form-control" id="exampleInputPassword1">
                </div>
				<div class="form-group">
                  <label for="exampleInputEmail1">smtpserver:</label>
                  <input type="text"  name="smtpserver" value="<?=$veri[0]->smtpserver?>" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputEmail1">smtpport:</label>
                  <input type="text"  name="smtpport" value="<?=$veri[0]->smtpport?>" class="form-control" id="exampleInputEmail1" >
                </div>
				 <div class="form-group">
                  <label for="exampleInputEmail1">smtpemail: </label>
                  <input type="text"  name="smtpemail" value="<?=$veri[0]->smtpemail?>" class="form-control" id="exampleInputEmail1" >
                </div>
				 <div class="form-group">
                  <label for="exampleInputEmail1">smtpsifre:</label>
                  <input type="text"  name="smtpsifre" value="<?=$veri[0]->smtpsifre?>" class="form-control" id="exampleInputEmail1" >
                </div>
				 <div class="form-group">
                  <label for="exampleInputEmail1">Adres:</label>
                  <input type="text"  name="adres" value="<?=$veri[0]->adres?>" class="form-control" id="exampleInputEmail1" >
                </div>
				 <div class="form-group">
                  <label for="exampleInputEmail1">Şehir:</label>
                  <input type="text"  name="sehir" value="<?=$veri[0]->sehir?>" class="form-control" id="exampleInputEmail1" >
                </div>
				 <div class="form-group">
                  <label for="exampleInputEmail1">Telefon</label>
                  <input type="text"  name="tel" value="<?=$veri[0]->tel?>" class="form-control" id="exampleInputEmail1" >
                </div>
				 <div class="form-group">
                  <label for="exampleInputEmail1">Fax</label>
                  <input type="text"  name="fax" value="<?=$veri[0]->fax?>" class="form-control" id="exampleInputEmail1" >
                </div>
				 <div class="form-group">
                  <label for="exampleInputEmail1">Email</label>
                  <input type="email"  name="email" value="<?=$veri[0]->email?>" class="form-control" id="exampleInputEmail1" >
                </div>
				 <div class="form-group">
                  <label for="exampleInputEmail1">Facebook</label>
                  <input type="text"  name="facebook" value="<?=$veri[0]->facebook?>" class="form-control" id="exampleInputEmail1" >
                </div>
				<div class="form-group">
                  <label for="exampleInputEmail1">İnstagram</label>
                  <input type="text"  name="instagram" value="<?=$veri[0]->instagram?>" class="form-control" id="exampleInputEmail1" >
                </div>
				<div class="form-group">
                  <label for="exampleInputEmail1">Pinterest</label>
                  <input type="text"  name="pinterest" value="<?=$veri[0]->pinterest?>" class="form-control" id="exampleInputEmail1" >
                </div>
				
				
				
              </div>
              <!-- /.box-body -->

              
                <button type="submit" class="btn btn-primary">Kaydet</button>
             
            </form>
    

  
